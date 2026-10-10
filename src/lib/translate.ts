import "server-only";

/**
 * Machine-translates the half of a listing the seller did not fill in.
 *
 * Every ad row stores a `_fr` and an `_ar` column. The post form is written in
 * whichever language the seller was browsing, so in practice one side arrives
 * empty. The public read path picks a column by the viewer's language with no
 * fallback, meaning an Arabic visitor to a French-only listing saw an empty
 * title rather than the French one.
 *
 * Translation is best-effort by design: if the model is unreachable or returns
 * something unusable, the source text is copied across so the listing is still
 * readable in both languages. A posting must never fail because a translation
 * did not arrive.
 */

/**
 * Translation runs inline in the ad insert path, so a model that never answers
 * has to be cheap to skip. gemini-3.8-flash was measured timing out on 4/4
 * calls from an Android/Termux network while gemini-3.6-flash answered in
 * ~2.2s, so the per-model budget is deliberately short and GEMINI_MODEL can
 * reorder the list without a code change.
 */
const MODELS = (process.env.GEMINI_MODEL || "gemini-3.8-flash,gemini-3.6-flash")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

const TIMEOUT_MS = 8_000;

/**
 * Gemini answers 503 "high demand" on roughly half of calls from an
 * unsaturated region, which is transient by definition. Three attempts turn
 * that into a ~12% miss rate instead of ~50%.
 */
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SYSTEM_PROMPT = `You translate listings for Souk.dz, an Algerian classifieds site.

Translate the given fields between French and Arabic.

Rules:
- Use Modern Standard Arabic for the Arabic side; Algerian users read it fine.
- Keep proper nouns, brand names, model numbers, measurements and prices exactly as they are (Renault Symbol, F3, 1.5L, 1500000 DA).
- Translate category vocabulary into the wording Algerian sellers actually use (e.g. "façade", "fauteuil", "motocycle", "appartement").
- Match the register of the original: a terse title stays terse. Do not embellish, add marketing language, or invent details that are not in the source.
- If a field is empty, return an empty string for it.
- Return only JSON, no commentary or code fences.`;

/** The two language columns a listing carries for free-text fields. */
export interface TranslatableAd {
  title_fr: string;
  title_ar: string;
  description_fr: string;
  description_ar: string;
  commune_fr: string;
  commune_ar: string;
  condition_fr: string;
  condition_ar: string;
  seller_fr: string;
  seller_ar: string;
}

type Direction = "fr>ar" | "ar>fr";

/** Works out which column of each pair is the one that needs filling. */
function plan(ad: TranslatableAd): Direction | null {
  const hasFr = Boolean(ad.title_fr || ad.description_fr);
  const hasAr = Boolean(ad.title_ar || ad.description_ar);
  if (hasFr && !hasAr) return "fr>ar";
  if (hasAr && !hasFr) return "ar>fr";
  return null;
}

/**
 * True when one language is present and the other is not, i.e. there is
 * something for translateAd to do. Lets a caller skip the work entirely
 * instead of paying for a request that would be a no-op.
 */
export function needsTranslation(ad: TranslatableAd): boolean {
  return plan(ad) !== null;
}

/** Copies whichever side exists into the empty one, untranslated. */
export function withoutTranslation(ad: TranslatableAd): TranslatableAd {
  return {
    ...ad,
    title_ar: ad.title_ar || ad.title_fr,
    title_fr: ad.title_fr || ad.title_ar,
    description_ar: ad.description_ar || ad.description_fr,
    description_fr: ad.description_fr || ad.description_ar,
    commune_ar: ad.commune_ar || ad.commune_fr,
    commune_fr: ad.commune_fr || ad.commune_ar,
    condition_ar: ad.condition_ar || ad.condition_fr,
    condition_fr: ad.condition_fr || ad.condition_ar,
    seller_ar: ad.seller_ar || ad.seller_fr,
    seller_fr: ad.seller_fr || ad.seller_ar,
  };
}

function jsonPayload(direction: Direction, ad: TranslatableAd): string {
  const source = direction === "fr>ar" ? "fr" : "ar";
  const target = direction === "fr>ar" ? "ar" : "fr";
  const fields = {
    title: ad[`title_${source}`] ?? "",
    description: ad[`description_${source}`] ?? "",
    commune: ad[`commune_${source}`] ?? "",
    condition: ad[`condition_${source}`] ?? "",
    seller: ad[`seller_${source}`] ?? "",
  };
  return JSON.stringify({ target_language: target, fields });
}

function parseTranslation(text: string): Record<string, string> | null {
  // Models sometimes wrap JSON in a fenced block despite being told not to.
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const parsed: unknown = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== "object") return null;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "string") out[k] = v;
    }
    return out;
  } catch {
    return null;
  }
}

/**
 * Writes a model reply into the target language columns. Returns null when the
 * reply carried no usable field, so the caller can try the next model instead
 * of storing a half-blank listing.
 */
function adopt(
  data: { candidates?: { content?: { parts?: { text?: string }[] } }[] },
  ad: TranslatableAd,
  target: "fr" | "ar"
): TranslatableAd | null {
  const raw = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("");
  const parsed = raw ? parseTranslation(raw) : null;
  if (!parsed) return null;

  const next: TranslatableAd = { ...ad };
  let wrote = false;
  for (const field of ["title", "description", "commune", "condition", "seller"] as const) {
    const value = (parsed[field] ?? "").trim();
    if (value) {
      next[`${field}_${target}`] = value;
      wrote = true;
    }
  }
  if (!wrote) return null;
  // Never let a model reply leave the target column empty again.
  return withoutTranslation(next);
}

/**
 * Fills the empty language of a listing. Never throws and never returns a
 * half-empty pair: on any failure the caller gets the source text copied
 * across.
 */
export async function translateAd(ad: TranslatableAd): Promise<TranslatableAd> {
  const direction = plan(ad);
  if (!direction) return withoutTranslation(ad);

  const apiKey = process.env.GEMINI_API_KEY || process.env.gemini_api_key;
  if (!apiKey) return withoutTranslation(ad);

  const source = direction === "fr>ar" ? "fr" : "ar";
  const target = direction === "fr>ar" ? "ar" : "fr";

  const body = JSON.stringify({
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: jsonPayload(direction, ad) }] }],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      maxOutputTokens: 1024,
    },
  });

  for (const model of MODELS) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) await sleep(BACKOFF_MS * attempt);
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            signal: AbortSignal.timeout(TIMEOUT_MS),
          }
        );

        // 503 is Gemini's transient "high demand" signal and clears on its own.
        // Measured at roughly half of all calls on gemini-3.6-flash, so a
        // single attempt loses about half of all translations.
        if (res.status === 503) continue;
        if (!res.ok) break;

        const data = (await res.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        const adopted = adopt(data, ad, target);
        if (adopted) return adopted;
        // Reply had nothing usable; try the next model.
        break;
      } catch {
        // Timeout or network error. Trying the same model again is unlikely to
        // help, so move on.
        break;
      }
    }
  }

  return withoutTranslation(ad);
}

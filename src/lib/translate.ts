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

const MODELS = (process.env.GEMINI_MODEL || "gemini-3.8-flash,gemini-3.6-flash")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

const TIMEOUT_MS = 12_000;

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

/** Copies whichever side exists into the empty one, untranslated. */
function withoutTranslation(ad: TranslatableAd): TranslatableAd {
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
      if (!res.ok) continue;
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const raw = data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("");
      const parsed = raw ? parseTranslation(raw) : null;
      if (!parsed) continue;

      const next: TranslatableAd = { ...ad };
      for (const field of ["title", "description", "commune", "condition", "seller"] as const) {
        const value = (parsed[field] ?? "").trim();
        if (value) next[`${field}_${target}`] = value;
      }
      // Never let a model reply leave the Arabic column empty again.
      return withoutTranslation(next);
    } catch {
      // Try the next model, then the untranslated fallback.
    }
  }

  return withoutTranslation(ad);
}

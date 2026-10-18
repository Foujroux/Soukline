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
 * Output budget for one translation reply.
 *
 * 1024 was a miss, and specifically on descriptions: a measured call on a
 * 646-character French description returned finishReason=MAX_TOKENS with
 * only 40 candidate tokens, because gemini-3.x spends its thinking budget
 * inside maxOutputTokens. The reply was cut off mid-sentence, JSON.parse
 * failed, and the listing silently stayed French. Short titles sometimes fit
 * inside 1024 and long descriptions never did, which is exactly the
 * "titles translate, descriptions don't" symptom.
 */
const MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 4096);

/**
 * Translation is mechanical, not a reasoning task, so thinking is switched off
 * and the whole budget goes to the answer. Kept as an env override because a
 * model that rejects thinkingBudget should not take the feature down.
 */
const THINKING_BUDGET = Number(process.env.GEMINI_THINKING_BUDGET || 0);

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

/**
 * Pulls complete `"key": "value"` pairs out of a reply that was cut off before
 * its closing brace.
 *
 * When maxOutputTokens truncates a reply, JSON.parse throws and the whole
 * translation is lost -- but the fields the model finished before running out
 * of budget are perfectly good. Truncation almost always lands inside the
 * longest field (the description), so the short ones come through and the
 * listing still gets a translated title and commune instead of nothing.
 *
 * This walks the text with a small scanner rather than a regex because values
 * contain escaped quotes (`".redis"`, `\"`), and a regex would end a value at
 * the first inner quote and hand back a fragment with a dangling backslash.
 */
function salvageTruncated(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  const KEY = /"([a-zA-Z_][a-zA-Z0-9_]*)"\s*:\s*"/g;

  let match: RegExpExecArray | null;
  while ((match = KEY.exec(text)) !== null) {
    const key = match[1];
    let i = match.index + match[0].length;
    let value = "";
    let closed = false;

    while (i < text.length) {
      const ch = text[i];
      if (ch === "\\") {
        // Keep the escape sequence intact; JSON.parse below decodes it.
        value += text[i] + (text[i + 1] ?? "");
        i += 2;
        continue;
      }
      if (ch === '"') {
        closed = true;
        i += 1;
        break;
      }
      value += ch;
      i += 1;
    }

    // Only keep values that were actually terminated by a quote. The last
    // value in a truncated reply is by definition unfinished.
    if (!closed) break;
    try {
      out[key] = JSON.parse(`"${value}"`) as string;
    } catch {
      // Undecodable escape; skip this field but keep scanning the rest.
    }
    KEY.lastIndex = i;
  }

  return out;
}

function parseTranslation(
  text: string,
  allowSalvage = false
): Record<string, string> | null {
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
    // Only the caller that knows the reply was truncated opts into salvage;
    // anywhere else a parse failure means the model returned junk.
    return allowSalvage ? salvageTruncated(cleaned) : null;
  }
}

/**
 * Writes a model reply into the target language columns. Returns null when the
 * reply carried no usable field, so the caller can try the next model instead
 * of storing a half-blank listing.
 */
function adopt(
  data: {
    candidates?: {
      finishReason?: string;
      content?: { parts?: { text?: string }[] };
    }[];
  },
  ad: TranslatableAd,
  target: "fr" | "ar"
): TranslatableAd | null {
  const raw = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("");
  if (!raw) return null;

  // MAX_TOKENS is the one failure this module used to swallow silently: the
  // reply was cut mid-JSON, the parse threw, and the listing kept its French
  // with nothing logged. Knowing the cause lets us salvage the fields that did
  // finish instead of throwing the whole reply away.
  const truncated = data.candidates?.[0]?.finishReason === "MAX_TOKENS";

  const parsed = parseTranslation(raw, truncated);
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

  const target = direction === "fr>ar" ? "ar" : "fr";

  /**
   * Builds the request. Truncation used to be fatal to the whole reply, so a
   * retry after one asks for more room rather than repeating the same shape and
   * getting cut at the same place.
   */
  const buildBody = (maxOutputTokens: number) =>
    JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: jsonPayload(direction, ad) }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        maxOutputTokens,
        thinkingConfig: { thinkingBudget: THINKING_BUDGET },
      },
    });

  /**
   * Last reply that was cut off. Kept so an exhausted retry loop can still
   * salvage the fields the model finished: a truncated reply is far better than
   * no reply, because the fallback copies French across and the listing shows
   * up untranslated in the Arabic view.
   */
  let truncatedReply: {
    candidates?: {
      finishReason?: string;
      content?: { parts?: { text?: string }[] };
    }[];
  } | null = null;

  for (const model of MODELS) {
    let maxOutputTokens = MAX_OUTPUT_TOKENS;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) await sleep(BACKOFF_MS * attempt);
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: buildBody(maxOutputTokens),
            signal: AbortSignal.timeout(TIMEOUT_MS),
          }
        );

        // 503 is Gemini's transient "high demand" signal and clears on its own.
        // Measured at roughly half of all calls on gemini-3.6-flash, so a
        // single attempt loses about half of all translations.
        if (res.status === 503) continue;
        if (!res.ok) break;

        const data = (await res.json()) as {
          candidates?: {
            finishReason?: string;
            content?: { parts?: { text?: string }[] };
          }[];
        };

        // A cut-off reply is a capacity problem, not a bad one, so give the
        // next attempt a bigger budget before accepting a salvaged partial.
        if (data.candidates?.[0]?.finishReason === "MAX_TOKENS") {
          truncatedReply = data;
          console.warn(
            `[translate] ${model}: reply hit maxOutputTokens=${maxOutputTokens}; retrying with more`
          );
          maxOutputTokens = Math.min(maxOutputTokens * 4, 16_384);
          continue;
        }

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

  if (truncatedReply) {
    const partial = adopt(truncatedReply, ad, target);
    if (partial) {
      console.warn("[translate] using fields salvaged from a truncated reply");
      return partial;
    }
  }

  return withoutTranslation(ad);
}

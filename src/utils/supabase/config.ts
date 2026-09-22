// Strips surrounding quotes and leading/trailing whitespace that can sneak in
// from .env files or deployment dashboards. A malformed value like
// '"https://....supabase.co"' or "   https://x.supabase.co   " otherwise
// produces unreachable auth endpoints and AuthRetryableFetchError
// ("fetch failed").
function cleanEnv(value: string | undefined): string {
  if (!value) return "";
  return value
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .trim()
    .replace(/\/+$/, "");
}

// If the URL was saved without a scheme (e.g. "xpxqrvxmvhjetnoehsdm.supabase.co"),
// prepend https:// automatically. Without a protocol, fetch() resolves it as a
// relative URL against the app origin, which surfaces as a non-listening
// "fetch failed" instead of reaching Supabase.
function normalizeUrl(raw: string | undefined): string {
  let value = cleanEnv(raw);
  if (value && !/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }
  return value;
}

export const supabaseUrl = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabaseKey =
  cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  "";

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseKey);
}

// Accepts the two supported Supabase API key formats: the legacy JWT anon key
// ("eyJ...") and the new opaque publishable key ("sb_publishable_...").
export function isValidKeyFormat(key: string): boolean {
  return key.startsWith("eyJ") || key.startsWith("sb_publishable_");
}

// Explicit auth headers attached to every Supabase client. Sending both
// `apikey` and `Authorization: Bearer ...` guarantees GoTrue accepts the key
// whether it is a legacy JWT anon token or the new "sb_publishable_..."
// format, instead of relying on the SDK's header derivation.
export function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { apikey: supabaseKey };
  if (supabaseKey) headers.Authorization = `Bearer ${supabaseKey}`;
  return headers;
}

export interface SupabaseConfigValidation {
  ok: boolean;
  /** Every finding (cosmetic warnings + fatal problems). */
  issues: string[];
  /** Problems that make any auth call impossible (block requests). */
  fatalIssues: string[];
}

function tryParseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/**
 * Validates the resolved Supabase configuration and reports every problem that
 * could cause an AuthRetryableFetchError ("fetch failed") at runtime: missing
 * env vars, wrapped quotes, surrounding whitespace, and a malformed /
 * non-https / non-root URL. Call this right before making auth calls and log
 * `issues` / `fatalIssues`.
 */
export function validateSupabaseConfig(): SupabaseConfigValidation {
  const issues: string[] = [];
  const fatalIssues: string[] = [];

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!rawUrl) {
    issues.push("NEXT_PUBLIC_SUPABASE_URL is undefined");
    fatalIssues.push("NEXT_PUBLIC_SUPABASE_URL is undefined");
  } else {
    if (rawUrl !== rawUrl.trim()) {
      issues.push("NEXT_PUBLIC_SUPABASE_URL contains leading/trailing whitespace");
    }
    if (/^["']|["']$/.test(rawUrl)) {
      issues.push("NEXT_PUBLIC_SUPABASE_URL is wrapped in quotes");
    }
    if (!/^https?:\/\//i.test(rawUrl)) {
      issues.push(
        'NEXT_PUBLIC_SUPABASE_URL has no scheme; "https://" was prepended automatically'
      );
    }
    if (!supabaseUrl) {
      issues.push("NEXT_PUBLIC_SUPABASE_URL is empty after sanitization");
      fatalIssues.push("NEXT_PUBLIC_SUPABASE_URL is empty after sanitization");
    } else {
      const parsed = tryParseUrl(supabaseUrl);
      if (!parsed) {
        issues.push(`NEXT_PUBLIC_SUPABASE_URL is not a valid URL: "${supabaseUrl}"`);
        fatalIssues.push("NEXT_PUBLIC_SUPABASE_URL is not a valid URL");
      } else {
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
          issues.push(
            `NEXT_PUBLIC_SUPABASE_URL protocol must be http(s):// (got "${parsed.protocol}//")`
          );
          fatalIssues.push("NEXT_PUBLIC_SUPABASE_URL must use http(s)");
        }
        if (!parsed.hostname || !parsed.hostname.includes(".")) {
          issues.push(
            `NEXT_PUBLIC_SUPABASE_URL hostname looks invalid: "${parsed.hostname}"`
          );
          fatalIssues.push("NEXT_PUBLIC_SUPABASE_URL hostname is invalid");
        }
        if (parsed.pathname !== "/" && parsed.pathname !== "") {
          issues.push(
            `NEXT_PUBLIC_SUPABASE_URL should point to the project root, got a path: "${supabaseUrl}"`
          );
          fatalIssues.push("NEXT_PUBLIC_SUPABASE_URL must be the project root");
        }
      }
    }
  }

  const rawKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!rawKey) {
    issues.push(
      "Supabase key is undefined (set NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)"
    );
    fatalIssues.push("Supabase key is undefined");
  } else {
    if (rawKey !== rawKey.trim()) {
      issues.push("Supabase key contains leading/trailing whitespace");
    }
    if (/^["']|["']$/.test(rawKey)) {
      issues.push("Supabase key is wrapped in quotes");
    }
    if (!supabaseKey) {
      issues.push("Supabase key is empty after sanitization");
      fatalIssues.push("Supabase key is empty after sanitization");
    } else if (!isValidKeyFormat(supabaseKey)) {
      issues.push(
        `Supabase key format is unsupported (expected "eyJ..." JWT or "sb_publishable_..."); got prefix "${supabaseKey.slice(
          0,
          18
        )}..."`
      );
      fatalIssues.push("Supabase key has an unsupported format");
    }
  }

  return { ok: fatalIssues.length === 0, issues, fatalIssues };
}

/**
 * Logs any configuration problem to the server logs so the real cause of an
 * AuthRetryableFetchError is visible in Vercel instead of a masked
 * "fetch failed".
 */
export function logSupabaseConfig(origin: string): void {
  const { issues } = validateSupabaseConfig();
  if (issues.length === 0) return;
  console.warn(`[supabase] ${origin}: configuration issues`, {
    supabaseUrl,
    issues,
  });
}
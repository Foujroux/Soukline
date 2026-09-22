// Shared diagnostic helpers for the /api/auth/* route handlers. These make
// the real cause of an AuthRetryableFetchError ("fetch failed") visible in
// Vercel logs and (temporarily) in the API JSON response.

// Resolves the most specific message for an error, preferring the underlying
// network cause over a generic wrapper (e.g. "fetch failed: getaddrinfo
// ENOTFOUND x.supabase.co"). Used in API responses so failures don't collapse
// into a plain "fetch failed" or a generic 401.
export function rootErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (
      err.cause instanceof Error &&
      err.cause.message &&
      err.cause.message !== err.message
    ) {
      return `${err.message}: ${err.cause.message}`;
    }
    return err.message;
  }
  return String(err);
}

// Serializes an Error (and its `.cause` chain) so the true DNS/TLS/timeout
// failure is visible in Vercel logs instead of just "fetch failed".
export function serializeError(
  depth: number,
  err: unknown
): Record<string, unknown> | string {
  if (depth > 3 || err === null || err === undefined) {
    return err === null || err === undefined ? "null" : String(err);
  }
  if (!(err instanceof Error)) return String(err);
  const out: Record<string, unknown> = { name: err.name, message: err.message };
  const anyErr = err as Error & { code?: string; status?: number; cause?: unknown };
  if (anyErr.code !== undefined) out.code = anyErr.code;
  if (anyErr.status !== undefined) out.status = anyErr.status;
  if (anyErr.cause !== undefined) out.cause = serializeError(depth + 1, anyErr.cause);
  return out;
}

// Direct native fetch probe against Supabase Auth BEFORE the SDK call, so the
// logs distinguish DNS, TLS/cert, timeout, and HTTP 401/403 failures.
export async function probeAuthHealth(origin: string, supabaseUrl: string): Promise<void> {
  const url = `${supabaseUrl}/auth/v1/health`;
  try {
    const res = await fetch(url, { method: "GET" });
    console.log(
      `[auth][diagnostic] ${origin}: Supabase health probe`,
      JSON.stringify({ url, status: res.status, ok: res.ok, statusText: res.statusText })
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(
        `[auth][diagnostic] ${origin}: Supabase health non-200`,
        JSON.stringify({ status: res.status, body: body.slice(0, 200) })
      );
    }
  } catch (err) {
    console.error(
      `[auth][diagnostic] ${origin}: Supabase health probe FAILED`,
      JSON.stringify({ url, error: serializeError(0, err) })
    );
  }
}

// Reports which auth-related env vars are actually present in the deployment,
// masking the values. Never falls back silently to undefined.
export function logEnvPresence(origin: string): void {
  const mask = (v: string | undefined): string =>
    !v ? "undefined" : `${v.slice(0, 6)}...${v.slice(-4)} (len ${v.length})`;
  console.log(
    `[auth][diagnostic] ${origin}: env keys present`,
    JSON.stringify({
      NEXT_PUBLIC_SUPABASE_URL: mask(process.env.NEXT_PUBLIC_SUPABASE_URL),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: mask(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: mask(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
      SUPABASE_SERVICE_ROLE_KEY: mask(process.env.SUPABASE_SERVICE_ROLE_KEY),
    })
  );
}
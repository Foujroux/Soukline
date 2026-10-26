import { createBrowserClient } from "@supabase/ssr";
import {
  authHeaders,
  isSupabaseConfigured,
  supabaseKey,
  supabaseUrl,
} from "./config";

const KNOWN_OAUTH_PROVIDERS = ["google", "facebook"] as const;
export type OAuthProvider = (typeof KNOWN_OAUTH_PROVIDERS)[number];

/**
 * Social providers currently offered by the app. Defaults to Google + Facebook
 * and can be overridden per environment with NEXT_PUBLIC_OAUTH_PROVIDERS
 * (comma-separated, e.g. "google"). An empty value disables social sign-in
 * entirely, which is how the broken providers can be taken offline without
 * touching code.
 */
function enabledOAuthProviders(): readonly OAuthProvider[] {
  const raw = process.env.NEXT_PUBLIC_OAUTH_PROVIDERS;
  if (raw === undefined) return [...KNOWN_OAUTH_PROVIDERS];
  const requested = raw
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  const allowed = requested.filter((p) =>
    (KNOWN_OAUTH_PROVIDERS as readonly string[]).includes(p)
  );
  return allowed as OAuthProvider[];
}

/** Social providers offered right now; empty means "social auth off". */
export const OAUTH_PROVIDERS: readonly OAuthProvider[] = enabledOAuthProviders();

export function isOAuthProvider(value: unknown): value is OAuthProvider {
  return (
    typeof value === "string" &&
    (OAUTH_PROVIDERS as readonly string[]).includes(value) &&
    (KNOWN_OAUTH_PROVIDERS as readonly string[]).includes(value)
  );
}

let cached: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Browser client used only for the OAuth handshake.
 *
 * It is deliberately separate from the client in `client.ts`, which is created
 * with `persistSession: false` and only ever calls an RPC. The PKCE flow needs
 * two things the RPC client must not do:
 *
 *   1. `flowType: "pkce"` so `signInWithOAuth` writes a code verifier, and
 *   2. the same storage for that verifier to be read back by
 *      `exchangeCodeForSession` on the callback page.
 *
 * `persistSession` stays false: once the callback has the tokens it posts them
 * to /api/auth/oauth/session, which moves the session into httpOnly cookies.
 * Leaving a copy in localStorage would only widen the XSS blast radius.
 */
export function createOAuthClient() {
  if (cached) return cached;
  if (!isSupabaseConfigured()) {
    throw new Error(
      "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)."
    );
  }
  cached = createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      flowType: "pkce",
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: authHeaders(),
    },
  });
  return cached;
}

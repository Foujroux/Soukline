import { createBrowserClient } from "@supabase/ssr";
import {
  authHeaders,
  isSupabaseConfigured,
  supabaseKey,
  supabaseUrl,
} from "./config";

/** Third-party social providers wired into the sign-in / sign-up screens. */
export const OAUTH_PROVIDERS = ["google", "facebook"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export function isOAuthProvider(value: unknown): value is OAuthProvider {
  return (
    typeof value === "string" &&
    (OAUTH_PROVIDERS as readonly string[]).includes(value)
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

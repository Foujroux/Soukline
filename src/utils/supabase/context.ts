import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  createAdminClient,
  createContextClient,
  resolveEnv,
  verifyCredentials,
} from "@supabase/server/core";
import type {
  AuthConfig,
  AuthError,
  AuthMode,
  JWTClaims,
  SupabaseEnv,
  UserClaims,
} from "@supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isSupabaseConfigured,
  supabaseKey,
  supabaseUrl,
} from "./config";

export interface AppContext {
  supabase: SupabaseClient;
  supabaseAdmin?: SupabaseClient;
  userClaims: UserClaims | null;
  jwtClaims: JWTClaims | null;
  authMode: AuthMode;
}

function deriveJwksUrl(url: string): URL | null {
  try {
    const base = new URL(url);
    if (base.protocol !== "https:" && base.protocol !== "http:") return null;
    return new URL(`${base.origin}/auth/v1/.well-known/jwks.json`);
  } catch {
    return null;
  }
}

// Bridges this app's env vars (NEXT_PUBLIC_* + the SUPABASE_* vars set in the
// project configuration) into the Partial<SupabaseEnv> shape the core
// primitives expect. Values already present in the runtime environment
// (SUPABASE_URL, SUPABASE_JWKS, SUPABASE_JWKS_URL, ...) are picked up via
// resolveEnv() and only overridden when the app-level vars are set.
export function buildSupabaseEnv(): Partial<SupabaseEnv> {
  const { data: env } = resolveEnv();
  const url = supabaseUrl || env?.url;
  const jwks =
    env?.jwks ?? (url ? deriveJwksUrl(url) : null);
  const overrides: Partial<SupabaseEnv> = {
    publishableKeys: {
      default: supabaseKey || env?.publishableKeys?.default || "",
    },
    secretKeys: {
      default:
        process.env.SUPABASE_SECRET_KEY || env?.secretKeys?.default || "",
    },
    jwks,
  };
  if (url) overrides.url = url;
  return overrides;
}

// Composes @supabase/server with @supabase/ssr for cookie-based (Next.js)
// contexts: @supabase/ssr owns the session cookies (refresh-token rotation
// runs in proxy.ts middleware), then the token is cryptographically verified
// against the project JWKS via verifyCredentials, and typed RLS/admin clients
// are built from the verified identity.
export async function createSupabaseContext(
  options: { auth?: AuthConfig } = {}
): Promise<{ data: AppContext | null; error: AuthError | null }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: null };
  }

  const env = buildSupabaseEnv();

  const cookieStore = await cookies();
  const ssrClient = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options: cookieOptions }) =>
            cookieStore.set(name, value, cookieOptions)
          );
        } catch {
          // Read-only contexts (Server Components, route handlers) delegate
          // session refresh to the middleware, so writes are best-effort.
        }
      },
    },
  });

  const {
    data: { session },
  } = await ssrClient.auth.getSession();

  const { data: auth, error } = await verifyCredentials(
    { token: session?.access_token ?? null, apikey: null },
    { auth: options.auth ?? "user", env }
  );
  if (error) return { data: null, error };

  let supabaseAdmin: SupabaseClient | undefined;
  try {
    supabaseAdmin = createAdminClient({ env });
  } catch {
    supabaseAdmin = undefined;
  }

  return {
    data: {
      supabase: createContextClient({
        auth: { token: auth.token, keyName: auth.keyName },
        env,
      }),
      supabaseAdmin,
      userClaims: auth.userClaims,
      jwtClaims: auth.jwtClaims,
      authMode: auth.authMode,
    },
    error: null,
  };
}
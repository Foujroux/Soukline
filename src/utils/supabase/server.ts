import { createServerClient } from "@supabase/ssr";
import { createContextClient } from "@supabase/server/core";
import type { NextResponse } from "next/server";
import {
  authHeaders,
  isSupabaseConfigured,
  supabaseKey,
  supabaseUrl,
} from "./config";
import { buildSupabaseEnv } from "./context";

export { isSupabaseConfigured };

export function cookiesFromHeader(
  header: string | null
): { name: string; value: string }[] {
  if (!header) return [];
  const parsed: { name: string; value: string }[] = [];
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    if (!name) continue;
    const value = part.slice(idx + 1).trim();
    try {
      parsed.push({ name, value: decodeURIComponent(value) });
    } catch {
      parsed.push({ name, value });
    }
  }
  return parsed;
}

// Route handlers own their outgoing response, so Supabase session cookies are
// written directly onto it (this is required for login/register/logout).
// persistSession stays enabled here: setAll() writes the auth cookies onto the
// outgoing response, and disabling it would stop login/register cookies from
// being set.
export function createRouteClient(
  request: Request,
  response: NextResponse
) {
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookiesFromHeader(request.headers.get("cookie"));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set({ name, value, ...options })
        );
      },
    },
    global: { fetch: fetch.bind(globalThis), headers: authHeaders() },
  });
}

// Anonymous RLS-scoped client for public reads (homepage, search, listings).
// Stateless — no session, RLS runs as the anon role.
export function createAnonClient() {
  return createContextClient({ env: buildSupabaseEnv() });
}
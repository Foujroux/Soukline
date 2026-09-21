import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "./config";

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

export const createClient = (
  cookieStore: Awaited<ReturnType<typeof cookies>>
) => {
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // `setAll` can be called from a Server Component, where cookies
          // cannot be modified. Middleware refreshes the session instead.
        }
      },
    },
    global: { fetch: fetch.bind(globalThis) },
  });
};

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
    global: { fetch: fetch.bind(globalThis) },
  });
}

// Read-only client for requests that never change the session (e.g. /me,
// protected API routes). Session refresh is handled by middleware.
export function createReadClient(request: Request) {
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookiesFromHeader(request.headers.get("cookie"));
      },
      setAll() {
        // Intentionally a no-op: middleware already refreshes expired tokens.
      },
    },
    auth: { persistSession: false },
    global: { fetch: fetch.bind(globalThis) },
  });
}

// Anonymous server-side client for public reads (homepage, search, listings).
export function createAnonClient() {
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // No cookies are persisted for anonymous public reads.
      },
    },
    auth: { persistSession: false },
    global: { fetch: fetch.bind(globalThis) },
  });
}
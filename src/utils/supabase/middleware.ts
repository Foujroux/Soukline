import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "./config";

export { isSupabaseConfigured };

export const createClient = async (request: NextRequest) => {
  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      "[supabase] NEXT_PUBLIC_SUPABASE_URL or a Supabase key is missing - skipping Supabase middleware"
    );
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }

  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
      global: { fetch: fetch.bind(globalThis) },
    },
  );

  // Refresh the user's session so cookies stay valid. NEVER let a network
  // failure here abort the request: if Supabase is unreachable, getUser()
  // throws and Next.js would respond 500 before the /api/auth/* route handler
  // ever runs - which is exactly how registration "disappears" from Vercel's
  // request logs. Catch the error, log it, and forward the request so the
  // route's own diagnostics capture the root cause.
  try {
    await supabase.auth.getUser();
  } catch (err) {
    const cause = (err as { cause?: unknown } | undefined)?.cause;
    console.error(
      "[supabase] proxy getUser() failed; forwarding request to the route handler so it can log the real cause",
      JSON.stringify({
        message: err instanceof Error ? err.message : String(err),
        cause:
          cause instanceof Error
            ? { name: cause.name, message: cause.message }
            : String(cause),
      })
    );
  }

  return supabaseResponse
};
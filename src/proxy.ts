import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@/utils/supabase/middleware";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

type RateLimitStore = Map<string, number[]>;

const globalStore = globalThis as unknown as { __soukdzRateLimits?: RateLimitStore };
const limits: RateLimitStore =
  globalStore.__soukdzRateLimits ?? (globalStore.__soukdzRateLimits = new Map());

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export const proxy = async (request: NextRequest) => {
  // Refresh the Supabase session by validating the auth token and issuing
  // updated cookie headers on the returned response.
  const supabaseResponse = await createSupabaseClient(request);

  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  const ip = getClientIp(request);
  const now = Date.now();

  const hits = (limits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);

  if (hits.length >= MAX_REQUESTS) {
    console.warn(
      `[proxy] rate limited ip=${ip} count=${hits.length} path=${pathname} - route handler NOT invoked`
    );
    const response = NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(WINDOW_MS / 1000)),
          "X-RateLimit-Limit": String(MAX_REQUESTS),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
    for (const cookie of supabaseResponse.cookies.getAll()) {
      response.cookies.set(cookie);
    }
    return response;
  }

  hits.push(now);
  limits.set(ip, hits);

  supabaseResponse.headers.set("X-RateLimit-Limit", String(MAX_REQUESTS));
  supabaseResponse.headers.set(
    "X-RateLimit-Remaining",
    String(MAX_REQUESTS - hits.length)
  );
  return supabaseResponse;
};

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
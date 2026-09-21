import { NextRequest, NextResponse } from "next/server";
import { userToSessionUser } from "@/lib/server-auth";
import {
  createRouteClient,
  isSupabaseConfigured,
} from "@/utils/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    console.error(
      "[auth] login blocked: NEXT_PUBLIC_SUPABASE_URL / ANON (or PUBLISHABLE) key missing"
    );
    return NextResponse.json({ error: "AUTH_NOT_CONFIGURED" }, { status: 500 });
  }

  const cookieJar = NextResponse.json({});
  const supabase = createRouteClient(request, cookieJar);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      if (/email.*not.*confirmed/i.test(error?.message ?? "")) {
        return NextResponse.json(
          { error: "EMAIL_NOT_CONFIRMED" },
          { status: 400 }
        );
      }
      console.warn(`[auth] login failed for "${email}": ${error?.message ?? "no user"}`);
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const response = NextResponse.json({ user: userToSessionUser(data.user) });
    return copySessionCookies(cookieJar, response);
  } catch (error) {
    console.error("login error:", error);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}

function copySessionCookies(from: NextResponse, to: NextResponse): NextResponse {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
  return to;
}
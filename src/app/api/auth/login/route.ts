import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, AuthError, createSession } from "@/lib/server-auth";

export const runtime = "nodejs";

const SESSION_COOKIE = "soukdz_session";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

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

  try {
    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }
    const token = createSession(user);
    const response = NextResponse.json({ user });
    response.cookies.set(SESSION_COOKIE, token, cookieOptions());
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.code === "ACCOUNT_LOCKED") {
        return NextResponse.json({ error: "ACCOUNT_LOCKED" }, { status: 423 });
      }
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }
    console.error("login error:", error);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
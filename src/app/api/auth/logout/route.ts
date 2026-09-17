import { NextRequest, NextResponse } from "next/server";
import { isSecureRequest, SESSION_COOKIE } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(request.headers.get("x-forwarded-proto"), request.url),
    path: "/",
    maxAge: 0,
  });
  return response;
}
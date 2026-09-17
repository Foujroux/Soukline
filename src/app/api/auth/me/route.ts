import { NextResponse } from "next/server";
import { getUserFromSessionToken, SESSION_COOKIE } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = request.headers.get("cookie")?.split(";").find((c) => c.trim().startsWith(`${SESSION_COOKIE}=`))?.split("=").slice(1).join("=");
  const user = await getUserFromSessionToken(token ? decodeURIComponent(token.trim()) : null);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}
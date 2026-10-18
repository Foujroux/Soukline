import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getUserFromRequest();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}
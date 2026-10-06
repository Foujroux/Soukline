import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server-auth";
import { listAds } from "@/lib/server-ads";

export const runtime = "nodejs";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (auth.user.accountType !== "admin") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const ads = await listAds();
  return NextResponse.json({ ads });
}

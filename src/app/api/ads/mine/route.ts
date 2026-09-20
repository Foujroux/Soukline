import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/server-auth";
import { getAdsByOwner, toPublicAd } from "@/lib/server-ads";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const ads = (await getAdsByOwner(user.id)).map(toPublicAd);
  return NextResponse.json({ ads });
}
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server-auth";
import { deleteAd, getAdBySlug, toPublicAd } from "@/lib/server-ads";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ad = await getAdBySlug(decodeURIComponent(slug));
  if (!ad) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ ad: toPublicAd(ad) });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { slug } = await params;
  try {
    const deleted = await deleteAd(auth.supabase, decodeURIComponent(slug), {
      id: auth.user.id,
      accountType: auth.user.accountType,
    });
    if (!deleted) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
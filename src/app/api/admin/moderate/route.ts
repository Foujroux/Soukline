import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server-auth";
import { deleteAd } from "@/lib/server-ads";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (auth.user.accountType !== "admin") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  let body: { action?: string; slug?: string; image?: string; userId?: string; banned?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  switch (body.action) {
    case "delete_ad": {
      if (!body.slug) return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
      const ok = await deleteAd(auth.supabase, body.slug, { id: auth.user.id, accountType: "admin" });
      return ok
        ? NextResponse.json({ ok: true })
        : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    case "delete_image": {
      if (!body.slug || !body.image) {
        return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
      }
      const { data: row, error: findError } = await auth.supabase
        .from("listings")
        .select("images")
        .eq("slug", body.slug)
        .maybeSingle();
      if (findError || !row) {
        return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      }
      const images = (Array.isArray(row.images) ? row.images : []).filter(
        (i: unknown) => i !== body.image
      );
      const { error } = await auth.supabase
        .from("listings")
        .update({ images })
        .eq("slug", body.slug);
      if (error) return NextResponse.json({ error: "DATABASE_ERROR" }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    case "set_banned": {
      if (!body.userId || typeof body.banned !== "boolean") {
        return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
      }
      if (body.userId === auth.user.id) {
        return NextResponse.json({ error: "CANNOT_BAN_SELF" }, { status: 400 });
      }
      const { error } = await auth.supabase
        .from("profiles")
        .update({ banned: body.banned })
        .eq("id", body.userId);
      if (error) return NextResponse.json({ error: "DATABASE_ERROR" }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
}

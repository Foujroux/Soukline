import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (auth.user.accountType !== "admin") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const { data, error } = await auth.supabase
    .from("profiles")
    .select("id, email, full_name, account_type, banned, created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "DATABASE_ERROR" }, { status: 500 });
  return NextResponse.json({ users: data ?? [] });
}

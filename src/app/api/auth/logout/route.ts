import { NextRequest, NextResponse } from "next/server";
import {
  createRouteClient,
  isSupabaseConfigured,
} from "@/utils/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  if (isSupabaseConfigured()) {
    try {
      const supabase = createRouteClient(request, response);
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("[auth] logout error:", error);
    }
  }
  return response;
}
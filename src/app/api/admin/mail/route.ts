import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server-auth";
import {
  createServiceRoleClient,
  isServiceRoleConfigured,
  listMailMessages,
  listMailThreads,
} from "@/lib/server-mail";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  // Same server-assigned role check as /api/admin/users. The caller-supplied
  // client cannot read these tables at all -- RLS is on with no policy -- which
  // is what keeps the gate here meaningful.
  if (auth.user.accountType !== "admin") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "SERVICE_ROLE_NOT_CONFIGURED" }, { status: 500 });
  }

  const threadId = new URL(request.url).searchParams.get("thread");

  try {
    const supabase = createServiceRoleClient();

    if (threadId) {
      const messages = await listMailMessages(supabase, threadId);
      return NextResponse.json({ threadId, messages });
    }

    const limitParam = Number(new URL(request.url).searchParams.get("limit"));
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 50;
    const threads = await listMailThreads(supabase, limit);
    return NextResponse.json({ threads });
  } catch (err) {
    const message = err instanceof Error ? err.message : "INTERNAL_ERROR";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
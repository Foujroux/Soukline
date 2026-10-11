import { NextResponse } from "next/server";
import {
  verifySvixSignature,
  type AgentMailEvent,
} from "@/lib/agentmail";
import {
  createServiceRoleClient,
  isServiceRoleConfigured,
  recordInboundMessage,
} from "@/lib/server-mail";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = (process.env.AGENTMAIL_WEBHOOK_SECRET ?? "").trim();
  if (!secret) {
    // Fail closed. Without the secret there is no way to tell a real delivery
    // from anyone who found the URL.
    console.error("[agentmail] AGENTMAIL_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "WEBHOOK_NOT_CONFIGURED" }, { status: 500 });
  }

  // The signature covers the exact bytes AgentMail sent, so the body is read
  // once as text and never parsed before verification.
  const rawBody = await request.text();

  if (!verifySvixSignature(rawBody, request.headers, secret)) {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 400 });
  }

  let event: AgentMailEvent;
  try {
    event = JSON.parse(rawBody) as AgentMailEvent;
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  if (event.event_type !== "message.received" || !event.message?.message_id) {
    // Other event types are acknowledged so AgentMail stops retrying them.
    return NextResponse.json({ ok: true, skipped: event.event_type ?? "unknown" });
  }

  if (!isServiceRoleConfigured()) {
    console.error(
      "[agentmail] SUPABASE_SECRET_KEY is not set; cannot store inbound mail"
    );
    // 500 so AgentMail retries once the variable is present.
    return NextResponse.json(
      { error: "SERVICE_ROLE_NOT_CONFIGURED" },
      { status: 500 }
    );
  }

  try {
    const supabase = createServiceRoleClient();
    const result = await recordInboundMessage(supabase, event.message);
    return NextResponse.json({ ok: true, inserted: result.inserted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "INTERNAL_ERROR";
    console.error("[agentmail] failed to record inbound message", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
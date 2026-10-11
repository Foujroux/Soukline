import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/utils/supabase/config";

const THREADS_TABLE = "mail_threads";
const MESSAGES_TABLE = "mail_messages";

/**
 * Strips the quote/wrapper damage .env files and dashboard copy-pastes
 * introduce. Same rationale as cleanEnv() in utils/supabase/config.ts: a value
 * like '"sb_secret_..."' otherwise produces an opaque 401 from PostgREST.
 */
function cleanEnv(value: string | undefined): string {
  if (!value) return "";
  return value
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .trim();
}

/**
 * The webhook has no user session, so it cannot use createSupabaseContext():
 * that resolves the caller from cookies and returns null. It needs the secret
 * key instead, which bypasses RLS.
 *
 * Accepts both the current `sb_secret_...` format (SUPABASE_SECRET_KEY, the
 * var utils/supabase/context.ts already reads) and the legacy
 * `SUPABASE_SERVICE_ROLE_KEY` JWT for older setups.
 */
function serviceRoleKey(): string {
  return (
    cleanEnv(process.env.SUPABASE_SECRET_KEY) ||
    cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

export function isServiceRoleConfigured(): boolean {
  return Boolean(supabaseUrl && serviceRoleKey());
}

export function createServiceRoleClient(): SupabaseClient {
  const key = serviceRoleKey();
  if (!supabaseUrl || !key) {
    throw new Error("SERVICE_ROLE_NOT_CONFIGURED");
  }
  return createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** A message as delivered in an AgentMail webhook payload. */
export interface InboundMessage {
  message_id: string;
  thread_id: string;
  inbox_id: string;
  from: string;
  subject?: string;
  text?: string;
  extracted_text?: string;
  html?: string;
  extracted_html?: string;
  preview?: string;
  timestamp?: string;
}

export interface RecordResult {
  threadId: string;
  /** False when this exact message was already stored by an earlier retry. */
  inserted: boolean;
}

/**
 * AgentMail sends `from` as either "user@domain.com" or
 * "Display Name <user@domain.com>"; both forms have to split into a name and
 * an address.
 */
export function splitAddress(raw: string | undefined): {
  email: string;
  name: string;
} {
  const value = (raw ?? "").trim();
  const angled = value.match(/^(.*?)\s*<([^>]+)>$/);
  if (angled) {
    return {
      name: angled[1].trim().replace(/^["']|["']$/g, ""),
      email: angled[2].trim().toLowerCase(),
    };
  }
  return { email: value.toLowerCase(), name: "" };
}

/**
 * Stores one inbound email as a thread plus a message row.
 *
 * Idempotent in both halves: the thread upserts on its AgentMail id, and the
 * message insert swallows the unique-violation that a Svix retry produces.
 */
export async function recordInboundMessage(
  supabase: SupabaseClient,
  message: InboundMessage
): Promise<RecordResult> {
  const { email, name } = splitAddress(message.from);
  const receivedAt = message.timestamp ?? new Date().toISOString();

  const { data: thread, error: threadError } = await supabase
    .from(THREADS_TABLE)
    .upsert(
      {
        agentmail_thread_id: message.thread_id,
        agentmail_inbox_id: message.inbox_id,
        subject: message.subject ?? "",
        sender_email: email,
        sender_name: name,
        last_message_at: receivedAt,
      },
      { onConflict: "agentmail_thread_id" }
    )
    .select("id")
    .single();

  if (threadError) {
    throw new Error(`MAIL_THREAD_UPSERT_FAILED: ${threadError.message}`);
  }

  // extracted_text is the reply body with quoted history and signature blocks
  // stripped, which is what an inbox should show. text is the fallback when a
  // message carries no extracted variant.
  const bodyText = message.extracted_text || message.text || message.preview || "";
  const bodyHtml = message.extracted_html || message.html || "";

  const { error: messageError } = await supabase.from(MESSAGES_TABLE).insert({
    thread_id: thread.id,
    agentmail_message_id: message.message_id,
    from_email: email,
    from_name: name,
    body_text: bodyText,
    body_html: bodyHtml,
    created_at: receivedAt,
  });

  if (messageError) {
    // 23505 = unique_violation: this message is already stored, so the
    // webhook is a retry. Anything else is a real failure worth surfacing.
    if (messageError.code === "23505") {
      return { threadId: thread.id, inserted: false };
    }
    throw new Error(`MAIL_MESSAGE_INSERT_FAILED: ${messageError.message}`);
  }

  // Recount rather than incrementing, so a retry that lost the message insert
  // cannot leave the thread permanently overcounted.
  const { count } = await supabase
    .from(MESSAGES_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("thread_id", thread.id);

  if (typeof count === "number") {
    await supabase
      .from(THREADS_TABLE)
      .update({ message_count: count })
      .eq("id", thread.id);
  }

  return { threadId: thread.id, inserted: true };
}

export interface MailThreadRow {
  id: string;
  subject: string;
  sender_email: string;
  sender_name: string;
  message_count: number;
  last_message_at: string;
  created_at: string;
}

export interface MailMessageRow {
  id: string;
  from_email: string;
  from_name: string;
  body_text: string;
  created_at: string;
}

/** Newest-first thread list for the admin mail feed. */
export async function listMailThreads(
  supabase: SupabaseClient,
  limit = 50
): Promise<MailThreadRow[]> {
  const { data, error } = await supabase
    .from(THREADS_TABLE)
    .select("id, subject, sender_email, sender_name, message_count, last_message_at, created_at")
    .order("last_message_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 200));

  if (error) throw new Error(`MAIL_THREADS_READ_FAILED: ${error.message}`);
  return (data ?? []) as MailThreadRow[];
}

/** Every message in one thread, oldest-first, for the thread detail view. */
export async function listMailMessages(
  supabase: SupabaseClient,
  threadId: string
): Promise<MailMessageRow[]> {
  const { data, error } = await supabase
    .from(MESSAGES_TABLE)
    .select("id, from_email, from_name, body_text, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`MAIL_MESSAGES_READ_FAILED: ${error.message}`);
  return (data ?? []) as MailMessageRow[];
}
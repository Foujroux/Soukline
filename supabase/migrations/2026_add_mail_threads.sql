-- Inbound AgentMail -> in-app conversation threads.
--
-- AgentMail delivers every message sent to the shared inbox
-- (foujroux-9018@agentmail.to) as a signed webhook, and
-- /api/webhooks/agentmail writes it here with the service role.
--
-- Both tables hold third-party email addresses and message bodies, so they
-- stay service-role only: RLS is enabled and no policy is created, which
-- leaves them unreachable for the anon/publishable key the browser uses.
-- Reads happen through /api/admin/mail, which is gated on the server-assigned
-- profiles.account_type = 'admin'.

create table if not exists public.mail_threads (
  id uuid primary key default gen_random_uuid(),
  -- Stable AgentMail id. Unique so webhook redeliveries (Svix retries reuse
  -- the same svix-id) collapse onto one row instead of forking the thread.
  agentmail_thread_id text not null unique,
  agentmail_inbox_id text not null default '',
  subject text not null default '',
  -- First sender of the thread, used to group it in the admin feed.
  sender_email text not null default '',
  sender_name text not null default '',
  -- Reserved for per-listing routing. Nothing populates it yet: every message
  -- currently lands in the one shared-inbox feed, matching the inbox layout.
  listing_id uuid references public.listings (id) on delete set null,
  message_count integer not null default 0,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists mail_threads_last_message_at_idx
  on public.mail_threads (last_message_at desc);

create index if not exists mail_threads_listing_id_idx
  on public.mail_threads (listing_id)
  where listing_id is not null;

create table if not exists public.mail_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.mail_threads (id) on delete cascade,
  -- Unique per AgentMail message id: this is the idempotency guard that stops
  -- a webhook retry from appending the same email twice.
  agentmail_message_id text not null unique,
  from_email text not null default '',
  from_name text not null default '',
  body_text text not null default '',
  body_html text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists mail_messages_thread_created_idx
  on public.mail_messages (thread_id, created_at);

alter table public.mail_threads enable row level security;
alter table public.mail_messages enable row level security;
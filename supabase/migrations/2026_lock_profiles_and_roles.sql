-- =============================================================================
-- Lock down profiles: stop the public user-directory leak and make the account
-- role server-assigned.
--
-- Apply in the Supabase SQL editor (Dashboard > SQL).
--
-- Two problems are fixed here:
--
-- 1. profiles_public_read was `using (true)`, so anyone holding the public
--    publishable key could dump every account's email and phone with
--      GET /rest/v1/profiles?select=email,phone,account_type
--    Nothing in the app reads this table for display (seller names come from
--    the listings row), so restricting it to the owner breaks no UI.
--
-- 2. The account role was client-asserted in three ways: it was accepted from
--    the register request body (including "admin"), it was read back from
--    user_metadata (which the account holder can rewrite at any time), and
--    RLS scopes rows rather than columns, so profiles_owner_update let any
--    user PATCH their own account_type. The role is now written once at
--    signup by the auth trigger, clamped to user/merchant, and is immutable
--    from the client.
--
-- "admin" remains in the column CHECK constraint so a DBA can still promote
-- someone from the dashboard or SQL editor; it is simply unreachable by
-- self-service.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. profiles is readable only by its owner
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_public_read" on public.profiles;
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read"
  on public.profiles for select
  using (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- 2. the auth trigger clamps the signup role to the self-service set
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  begin
    insert into public.profiles (id, email, full_name, phone, account_type, lang)
    values (
      new.id,
      coalesce(new.email, ''),
      coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1), ''),
      coalesce(new.raw_user_meta_data ->> 'phone', '', ''),
      case when new.raw_user_meta_data ->> 'account_type' = 'merchant'
           then 'merchant' else 'user' end,
      coalesce(new.raw_user_meta_data ->> 'lang', 'fr', 'fr')
    )
    on conflict (id) do update set
      email = excluded.email,
      full_name = excluded.full_name,
      phone = excluded.phone,
      lang = excluded.lang;
  exception when others then
    raise notice 'handle_new_user profile sync skipped for %: %', new.id, sqlerrm;
  end;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. account_type and email are immutable from the client
-- -----------------------------------------------------------------------------
create or replace function public.guard_profile_server_columns()
returns trigger
language plpgsql
security inviner set search_path = public
as $$
declare
  claims text;
  role_name text;
begin
  claims := coalesce(
    current_setting('request.jwt.claim.role', true),
    current_setting('request.jwt.claims', true),
    ''
  );
  -- No claim at all means this is not a client request: the auth trigger, a
  -- migration or the SQL editor, none of which should be clamped.
  if claims = '' then
    return new;
  end if;

  if claims like '{%' then
    begin
      role_name := claims::jsonb ->> 'role';
    exception when others then
      role_name := 'authenticated';
    end;
  else
    role_name := claims;
  end if;

  -- Fail closed: an unreadable or absent role is treated as a client, so a
  -- parsing problem downgrades the row to 'user' rather than letting a
  -- privileged column be written.
  if role_name is null or role_name in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.account_type := 'user';
    else
      new.account_type := old.account_type;
      new.email := old.email;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_server_columns on public.profiles;
create trigger guard_profile_server_columns
  before insert or update on public.profiles
  for each row execute function public.guard_profile_server_columns();

-- -----------------------------------------------------------------------------
-- 4. review existing accounts
-- -----------------------------------------------------------------------------
-- There is no safe way to auto-repair this: a role of 'admin' might have been
-- set deliberately from the dashboard, or it might be an escalation that
-- succeeded while profiles_owner_update allowed the account_type column to be
-- written. Read the list and decide per row.
--
-- Run this after applying the migration above:
--
--   select id, email, full_name, account_type, created_at
--     from public.profiles
--    where account_type <> 'user'
--    order by created_at;
--
-- Demote an escalated account with:
--
--   update public.profiles set account_type = 'user' where id = '<uuid>';
--
-- (That update is intentionally not scripted here. It runs as the table
-- owner, so the client guard does not block it.)

-- Add banned flag to profiles and admin policies for moderation.
alter table public.profiles add column if not exists banned boolean not null default false;

create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and account_type = 'admin'
  );
$$;

drop policy if exists "profiles_admin_select" on public.profiles;
create policy "profiles_admin_select"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "listings_admin_delete" on public.listings;
create policy "listings_admin_delete"
  on public.listings for delete
  using (public.is_admin());

drop policy if exists "listings_admin_update" on public.listings;
create policy "listings_admin_update"
  on public.listings for update
  using (public.is_admin())
  with check (public.is_admin());

-- A banned user must not be able to unban themselves, and admins' role/email
-- edits on other users should stay clamped as before.
create or replace function public.guard_profile_server_columns()
returns trigger
language plpgsql
security invoker set search_path = public
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

  if role_name is null or role_name in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.account_type := 'user';
      new.banned := false;
    else
      new.account_type := old.account_type;
      new.email := old.email;
      -- owners may not flip their own banned flag in either direction
      if old.id = auth.uid() then
        new.banned := old.banned;
      end if;
    end if;
  end if;
  return new;
end;
$$;

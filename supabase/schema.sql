-- =============================================================================
-- Souk.dz - Production schema
-- Run this in the Supabase SQL editor (Dashboard > SQL) against the project
-- referenced by NEXT_PUBLIC_SUPABASE_URL.
--
-- It defines:
--   * profiles : a per-user row synced from Supabase Auth accounts
--   * listings : user-generated ads owned by an authenticated user (user_id)
-- plus Row Level Security so the anon/publishable key can read published
-- listings but only the owner can insert/update/delete their own.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text not null default '',
  account_type text not null default 'user' check (account_type in ('user', 'merchant', 'admin')),
  lang text not null default 'fr' check (lang in ('fr', 'ar')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read"
  on public.profiles for select
  using (true);

drop policy if exists "profiles_owner_insert" on public.profiles;
create policy "profiles_owner_insert"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_owner_update" on public.profiles;
create policy "profiles_owner_update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Keep profiles in sync with auth.users (falls back to auth email/phone).
-- Wrapped in an exception handler so a hiccup in the side-effect table can
-- NEVER abort the auth.users insert (that would surface to the API as a
-- "signup failed" error even though the account was created).
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
      coalesce(new.raw_user_meta_data ->> 'account_type', 'user', 'user'),
      coalesce(new.raw_user_meta_data ->> 'lang', 'fr', 'fr')
    )
    on conflict (id) do update set
      email = excluded.email,
      full_name = excluded.full_name,
      phone = excluded.phone,
      account_type = excluded.account_type,
      lang = excluded.lang;
  exception when others then
    raise notice 'handle_new_user profile sync skipped for %: %', new.id, sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- listings
-- -----------------------------------------------------------------------------
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  slug text not null unique,
  category_slug text not null default 'services',
  title_fr text not null default '',
  title_ar text not null default '',
  description_fr text not null default '',
  description_ar text not null default '',
  price numeric not null default 0 check (price >= 0),
  currency text not null default 'DA',
  wilaya_code integer not null default 0,
  commune_fr text not null default '',
  commune_ar text not null default '',
  condition_fr text not null default '',
  condition_ar text not null default '',
  seller_fr text not null default '',
  seller_ar text not null default '',
  phone text not null default '',
  email text not null default '',
  views integer not null default 0,
  featured boolean not null default false,
  negotiable boolean not null default false,
  account_type text not null default 'user',
  images jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists listings_user_id_idx on public.listings (user_id);
create index if not exists listings_category_slug_idx on public.listings (category_slug);
create index if not exists listings_created_at_idx on public.listings (created_at desc);

alter table public.listings enable row level security;

-- Anyone (anonymous visitors included) can read published listings.
drop policy if exists "listings_public_read" on public.listings;
create policy "listings_public_read"
  on public.listings for select
  using (true);

-- A logged-in user can publish a listing on their own account.
drop policy if exists "listings_owner_insert" on public.listings;
create policy "listings_owner_insert"
  on public.listings for insert
  with check (auth.uid() = user_id);

drop policy if exists "listings_owner_update" on public.listings;
create policy "listings_owner_update"
  on public.listings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "listings_owner_delete" on public.listings;
create policy "listings_owner_delete"
  on public.listings for delete
  using (auth.uid() = user_id);
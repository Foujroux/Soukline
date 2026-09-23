-- -----------------------------------------------------------------------------
-- Add the missing `negotiable` column to `listings`.
-- Run this in the Supabase SQL editor if the live table predates the column,
-- otherwise INSERT/UPDATE fail with:
--   "Could not find the 'negotiable' column of 'listings' in the schema cache"
-- -----------------------------------------------------------------------------
alter table public.listings
  add column if not exists negotiable boolean not null default false;
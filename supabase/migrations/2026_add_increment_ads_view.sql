-- -----------------------------------------------------------------------------
-- RPC that increments the view counter of a single listing.
-- SECURITY DEFINER + explicit grant to anon because `listings` RLS only lets
-- the owner UPDATE their own rows, and page views come from anonymous visitors.
-- -----------------------------------------------------------------------------
create or replace function public.increment_ads_view(listing_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_views integer;
begin
  update public.listings
     set views = views + 1
   where id = listing_id
   returning views into new_views;

  return coalesce(new_views, 0);
end;
$$;

revoke all on function public.increment_ads_view(uuid) from public;
grant execute on function public.increment_ads_view(uuid) to anon, authenticated;
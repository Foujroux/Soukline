-- -----------------------------------------------------------------------------
-- Add the `video_url` column to `listings`.
--
-- Sellers attach a YouTube or Vimeo link to an ad instead of uploading a file:
-- the app has no file storage, and photos are inlined as base64 in the row, so
-- a video file would break both the request size limit and the public read
-- path. The column holds the canonical link (https://www.youtube.com/watch?v=ID
-- or https://vimeo.com/ID); the embed URL is rebuilt from it when the ad page
-- renders, so a stored value can never point an iframe anywhere else.
-- -----------------------------------------------------------------------------
alter table public.listings
  add column if not exists video_url text not null default '';

-- Ensure the multi-image post schema exists on projects where the earlier
-- post-media migration was not applied. Safe to run more than once.
--
-- Keep image_url as the legacy/primary image column. Existing rows retain their
-- current URLs; media_urls is backfilled only when it is empty.
alter table public.posts
  add column if not exists media_urls text[] not null default '{}';

update public.posts
set media_urls = array[image_url]
where coalesce(array_length(media_urls, 1), 0) = 0
  and image_url is not null
  and image_url <> '';

-- Tell PostgREST to refresh its schema cache after this migration is applied.
notify pgrst, 'reload schema';

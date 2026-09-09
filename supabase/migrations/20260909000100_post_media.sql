alter table public.posts
add column if not exists media_urls text[] not null default '{}';

update public.posts
set media_urls = array[image_url]
where coalesce(array_length(media_urls, 1), 0) = 0
  and image_url is not null
  and image_url <> '';

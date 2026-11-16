-- Enforce moderation through the server publication endpoint.
-- The endpoint uses SUPABASE_SERVICE_ROLE_KEY only on the server after validating
-- the caller's Supabase access token. Service-role requests bypass RLS.
--
-- Existing post-image objects and their public URLs remain unchanged. This does
-- not change the post-images bucket's public setting.

alter table public.posts enable row level security;

-- Keep the existing public feed readable, including older posts.
drop policy if exists "Posts are publicly readable" on public.posts;
create policy "Posts are publicly readable"
on public.posts
for select
to anon, authenticated
using (true);

-- Restrictive policies are ANDed with permissive policies, so an older permissive
-- client-insert policy cannot bypass this rule.
drop policy if exists "Require server moderation for post inserts" on public.posts;
create policy "Require server moderation for post inserts"
on public.posts
as restrictive
for insert
to anon, authenticated
with check (false);

-- Block direct client edits to image/post content, which could otherwise replace
-- an image URL without passing through moderation. Server service-role writes work.
drop policy if exists "Require server moderation for post updates" on public.posts;
create policy "Require server moderation for post updates"
on public.posts
as restrictive
for update
to anon, authenticated
using (false)
with check (false);

-- Public bucket reads continue to work. Prevent authenticated clients from
-- uploading or replacing files in post-images outside the moderation endpoint.
drop policy if exists "Require server moderation for post image uploads" on storage.objects;
create policy "Require server moderation for post image uploads"
on storage.objects
as restrictive
for insert
to anon, authenticated
with check (bucket_id <> 'post-images');

drop policy if exists "Require server moderation for post image updates" on storage.objects;
create policy "Require server moderation for post image updates"
on storage.objects
as restrictive
for update
to anon, authenticated
using (bucket_id <> 'post-images')
with check (bucket_id <> 'post-images');

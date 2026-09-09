create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table public.follows enable row level security;

drop policy if exists "Users can read follows involving themselves" on public.follows;
create policy "Users can read follows involving themselves"
on public.follows
for select
to authenticated
using (auth.uid() = follower_id or auth.uid() = following_id);

drop policy if exists "Users can follow others" on public.follows;
create policy "Users can follow others"
on public.follows
for insert
to authenticated
with check (auth.uid() = follower_id);

drop policy if exists "Users can unfollow others" on public.follows;
create policy "Users can unfollow others"
on public.follows
for delete
to authenticated
using (auth.uid() = follower_id);

create index if not exists follows_follower_idx on public.follows (follower_id, created_at desc);
create index if not exists follows_following_idx on public.follows (following_id, created_at desc);

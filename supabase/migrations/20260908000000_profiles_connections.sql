create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  avatar_seed text not null default 'flower',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are searchable by everyone"
  on public.profiles for select using (true);
create policy "Users can create their own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

after insert on auth.users is not supported in plain SQL migrations, so profiles are created by the app during signup/profile load.

create table if not exists public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(sender_id, receiver_id),
  check(sender_id <> receiver_id)
);

alter table public.connection_requests enable row level security;

create policy "Users can view requests involving them"
  on public.connection_requests for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send requests"
  on public.connection_requests for insert
  with check (auth.uid() = sender_id);
create policy "Receivers can update incoming requests"
  on public.connection_requests for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);
create policy "Senders can cancel pending requests"
  on public.connection_requests for delete
  using (auth.uid() = sender_id and status = 'pending');

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

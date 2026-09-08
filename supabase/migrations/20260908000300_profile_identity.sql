alter table public.profiles
  add column if not exists username text,
  add column if not exists description text not null default '';

create or replace function public.make_profile_username(p_name text, p_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  candidate text;
  suffix text;
  attempt integer := 0;
begin
  base := lower(regexp_replace(trim(coalesce(p_name, '')), '[^a-zA-Z0-9]+', '', 'g'));
  if base = '' then
    base := 'thredori';
  end if;
  base := left(base, 24);

  candidate := base;
  while exists (select 1 from public.profiles where username = candidate and id <> p_id) loop
    attempt := attempt + 1;
    suffix := lower(substr(replace(p_id::text, '-', ''), 1 + ((attempt - 1) % 24), 6));
    candidate := left(base, 24) || suffix;
    if attempt > 20 then
      candidate := left(base, 18) || substr(md5(random()::text || clock_timestamp()::text), 1, 8);
      exit;
    end if;
  end loop;
  return candidate;
end;
$$;

update public.profiles p
set username = public.make_profile_username(p.full_name, p.id)
where p.username is null or trim(p.username) = '';

alter table public.profiles
  alter column username set not null;

create unique index if not exists profiles_username_unique
  on public.profiles (lower(username));

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  name_value text;
  username_value text;
begin
  name_value := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '');
  username_value := public.make_profile_username(name_value, new.id);

  insert into public.profiles (id, full_name, username, description, avatar_seed)
  values (new.id, name_value, username_value, '', 'flower')
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.sync_profile_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.username is null or trim(new.username) = '' then
    new.username := public.make_profile_username(new.full_name, new.id);
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profile_identity_before_write on public.profiles;
create trigger profile_identity_before_write
before insert or update of full_name, username, description, avatar_url, avatar_seed
on public.profiles
for each row execute function public.sync_profile_identity();

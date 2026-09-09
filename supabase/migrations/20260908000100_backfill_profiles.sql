-- Make every existing and future auth user discoverable in Thredori.
-- Existing users keep their current profile/avatar choice.
-- New users receive one of the cute default avatars at random.

insert into public.profiles (id, full_name, avatar_seed)
select
  id,
  coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''),
  'flower'
from auth.users
on conflict (id) do update
set full_name = case
  when public.profiles.full_name = '' then excluded.full_name
  else public.profiles.full_name
end;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  avatar_options text[] := array['flower', 'smiley', 'heart', 'sun', 'cloud', 'star'];
begin
  insert into public.profiles (id, full_name, avatar_seed)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    avatar_options[1 + floor(random() * array_length(avatar_options, 1))::int]
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

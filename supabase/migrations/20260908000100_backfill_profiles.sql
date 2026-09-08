-- Make every existing and future auth user discoverable in Thredori.
-- Existing users get a profile row from their Google/email metadata.

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
begin
  insert into public.profiles (id, full_name, avatar_seed)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    'flower'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

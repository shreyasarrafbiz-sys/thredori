-- Give every new Thredori user a random cute default avatar.
-- Existing profile choices are not changed.

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

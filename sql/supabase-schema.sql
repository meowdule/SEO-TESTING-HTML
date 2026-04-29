-- Supabase SQL Editor에서 한 번에 실행하세요.
-- 이후 Authentication > Providers 에서 Email 확인(Confirm email)을 끄면 데모가 바로 로그인됩니다.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text not null,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.posts enable row level security;

drop policy if exists "posts_select_all" on public.posts;
create policy "posts_select_all" on public.posts for select using (true);

drop policy if exists "posts_insert_self" on public.posts;
create policy "posts_insert_self" on public.posts for insert with check (auth.uid() = author_id);

drop policy if exists "posts_update_self" on public.posts;
create policy "posts_update_self" on public.posts for update using (auth.uid() = author_id);

drop policy if exists "posts_delete_self" on public.posts;
create policy "posts_delete_self" on public.posts for delete using (auth.uid() = author_id);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz
);

alter table public.comments enable row level security;

drop policy if exists "comments_select_all" on public.comments;
create policy "comments_select_all" on public.comments for select using (true);

drop policy if exists "comments_insert_self" on public.comments;
create policy "comments_insert_self" on public.comments for insert with check (auth.uid() = author_id);

drop policy if exists "comments_update_self" on public.comments;
create policy "comments_update_self" on public.comments for update using (auth.uid() = author_id);

drop policy if exists "comments_delete_self" on public.comments;
create policy "comments_delete_self" on public.comments for delete using (auth.uid() = author_id);

create or replace function public.resolve_login(p_login text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare e text;
begin
  select au.email into e
  from auth.users au
  left join public.profiles p on p.id = au.id
  where lower(trim(au.email)) = lower(trim(p_login))
     or lower(trim(p.username)) = lower(trim(p_login))
  limit 1;
  return e;
end;
$$;

grant execute on function public.resolve_login(text) to anon, authenticated;

create or replace function public.find_username_by_email(p_email text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare u text;
begin
  select p.username into u
  from public.profiles p
  join auth.users au on au.id = p.id
  where lower(trim(au.email)) = lower(trim(p_email))
  limit 1;
  return u;
end;
$$;

grant execute on function public.find_username_by_email(text) to anon, authenticated;

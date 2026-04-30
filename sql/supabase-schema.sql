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

-- ---------------------------------------------------------------------------
-- API 역할이 테이블을 읽을 수 있도록 권한 부여 (RLS는 그대로 적용됨)
-- 게시글/댓글이 다른 사용자에게 안 보일 때 이 블록 실행 여부를 확인하세요.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant select, insert, update, delete on public.posts to authenticated;
grant select on public.posts to anon;
grant select, insert, update, delete on public.comments to authenticated;
grant select on public.comments to anon;

-- ---------------------------------------------------------------------------
-- 문의 / 신청 (공개 폼에서 anon insert, 관리자만 전체 조회)
-- 관리자 등록: 아래 주석 참고 후 app_admins 에 본인 user_id 삽입
-- ---------------------------------------------------------------------------

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.app_admins enable row level security;

drop policy if exists "app_admins_select_self" on public.app_admins;
create policy "app_admins_select_self" on public.app_admins for select using (user_id = auth.uid());

create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  topic text not null,
  body text not null,
  created_at timestamptz default now()
);

alter table public.contact_inquiries enable row level security;

drop policy if exists "contact_inquiries_select_admin" on public.contact_inquiries;
create policy "contact_inquiries_select_admin" on public.contact_inquiries for select to authenticated using (
  exists (select 1 from public.app_admins a where a.user_id = auth.uid())
);

drop policy if exists "contact_inquiries_insert_public" on public.contact_inquiries;
create policy "contact_inquiries_insert_public" on public.contact_inquiries for insert to anon, authenticated with check (true);

create table if not exists public.apply_submissions (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  contact_name text not null,
  email text not null,
  plan text not null,
  note text,
  created_at timestamptz default now()
);

alter table public.apply_submissions enable row level security;

drop policy if exists "apply_submissions_select_admin" on public.apply_submissions;
create policy "apply_submissions_select_admin" on public.apply_submissions for select to authenticated using (
  exists (select 1 from public.app_admins a where a.user_id = auth.uid())
);

drop policy if exists "apply_submissions_insert_public" on public.apply_submissions;
create policy "apply_submissions_insert_public" on public.apply_submissions for insert to anon, authenticated with check (true);

grant select, insert, update, delete on public.contact_inquiries to authenticated;
grant insert on public.contact_inquiries to anon;
grant select, insert, update, delete on public.apply_submissions to authenticated;
grant insert on public.apply_submissions to anon;

-- 관리자로 지정할 계정의 UUID 를 넣으세요. (Authentication → Users 또는 아래 쿼리로 확인)
-- insert into public.app_admins (user_id)
-- select id from auth.users where email = 'your@email.test' limit 1
-- on conflict (user_id) do nothing;

-- Mikesta's first Supabase migration.
-- Run this once in Supabase SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  caption text,
  location text,
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.saved_posts (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.comments (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 180),
  created_at timestamptz not null default now()
);

create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- Create a public profile as soon as a user registers, including when email
-- confirmation is enabled and there is not an active session yet.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, bio, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1), 'user_' || left(new.id::text, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    'Creator on Mikesta.',
    null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill profiles for users created before the trigger was installed.
insert into public.profiles (id, username, display_name, bio, avatar_url)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1), 'user_' || left(u.id::text, 8)),
  coalesce(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)),
  'Creator on Mikesta.',
  null
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.saved_posts enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;

drop policy if exists "Profiles are publicly readable" on public.profiles;
drop policy if exists "Users create their own profile" on public.profiles;
drop policy if exists "Users update their own profile" on public.profiles;
create policy "Profiles are publicly readable"
  on public.profiles for select using (true);

create policy "Users create their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users update their own profile"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "Posts are publicly readable" on public.posts;
drop policy if exists "Users create their own posts" on public.posts;
drop policy if exists "Users update their own posts" on public.posts;
drop policy if exists "Users delete their own posts" on public.posts;
create policy "Posts are publicly readable"
  on public.posts for select using (true);

create policy "Users create their own posts"
  on public.posts for insert with check (auth.uid() = user_id);

create policy "Users update their own posts"
  on public.posts for update using (auth.uid() = user_id);

create policy "Users delete their own posts"
  on public.posts for delete using (auth.uid() = user_id);

drop policy if exists "Users manage their own likes" on public.likes;
drop policy if exists "Like counts are publicly readable" on public.likes;
create policy "Users manage their own likes"
  on public.likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Like counts are publicly readable"
  on public.likes for select using (true);

drop policy if exists "Users manage their own saved posts" on public.saved_posts;
create policy "Users manage their own saved posts"
  on public.saved_posts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Comments are publicly readable" on public.comments;
drop policy if exists "Users create their own comments" on public.comments;
drop policy if exists "Users delete their own comments" on public.comments;
create policy "Comments are publicly readable"
  on public.comments for select using (true);

create policy "Users create their own comments"
  on public.comments for insert with check (auth.uid() = user_id);

create policy "Users delete their own comments"
  on public.comments for delete using (auth.uid() = user_id);

drop policy if exists "Follows are publicly readable" on public.follows;
drop policy if exists "Users manage their own follows" on public.follows;
create policy "Follows are publicly readable"
  on public.follows for select using (true);

create policy "Users manage their own follows"
  on public.follows for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can view post images" on storage.objects;
drop policy if exists "Users upload their own post images" on storage.objects;
drop policy if exists "Users update their own post images" on storage.objects;
drop policy if exists "Users delete their own post images" on storage.objects;
create policy "Anyone can view post images"
  on storage.objects for select
  using (bucket_id = 'posts');

create policy "Users upload their own post images"
  on storage.objects for insert
  with check (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users update their own post images"
  on storage.objects for update
  using (bucket_id = 'posts' and owner_id = auth.uid()::text);

create policy "Users delete their own post images"
  on storage.objects for delete
  using (bucket_id = 'posts' and owner_id = auth.uid()::text);
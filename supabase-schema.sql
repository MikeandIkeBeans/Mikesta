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

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.saved_posts enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select using (true);

create policy "Users create their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users update their own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Posts are publicly readable"
  on public.posts for select using (true);

create policy "Users create their own posts"
  on public.posts for insert with check (auth.uid() = user_id);

create policy "Users update their own posts"
  on public.posts for update using (auth.uid() = user_id);

create policy "Users delete their own posts"
  on public.posts for delete using (auth.uid() = user_id);

create policy "Users manage their own likes"
  on public.likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Like counts are publicly readable"
  on public.likes for select using (true);

create policy "Users manage their own saved posts"
  on public.saved_posts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Comments are publicly readable"
  on public.comments for select using (true);

create policy "Users create their own comments"
  on public.comments for insert with check (auth.uid() = user_id);

create policy "Users delete their own comments"
  on public.comments for delete using (auth.uid() = user_id);

create policy "Follows are publicly readable"
  on public.follows for select using (true);

create policy "Users manage their own follows"
  on public.follows for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do nothing;

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
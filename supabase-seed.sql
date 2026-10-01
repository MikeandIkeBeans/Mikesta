-- Mikesta Supabase Seed Migration
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/rzrxljijijowmfoedwoe/sql)
-- This script creates the posts storage bucket, seeds confirmed demo users, profiles, posts, comments, likes, and follows.

-- 1. Ensure required extensions
create extension if not exists "pgcrypto";

-- 2. Ensure Storage Bucket exists and is public
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('posts', 'posts', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public = true;

-- Drop and recreate storage policies safely
do $$
begin
  drop policy if exists "Anyone can view post images" on storage.objects;
  drop policy if exists "Users upload their own post images" on storage.objects;
  drop policy if exists "Public upload for post images" on storage.objects;
  
  create policy "Anyone can view post images"
    on storage.objects for select
    using (bucket_id = 'posts');

  create policy "Public upload for post images"
    on storage.objects for insert
    with check (bucket_id = 'posts');
end $$;

-- 3. Seed Demo Users in auth.users (with email_confirmed_at so no confirmation email is required!)
-- Password for all seed users is: password123
do $$
declare
  v_user1_id uuid := 'a1111111-1111-1111-1111-111111111111';
  v_user2_id uuid := 'b2222222-2222-2222-2222-222222222222';
  v_user3_id uuid := 'c3333333-3333-3333-3333-333333333333';
  v_user4_id uuid := 'd4444444-4444-4444-4444-444444444444';
  v_post1_id uuid := '10000000-0000-0000-0000-000000000001';
  v_post2_id uuid := '10000000-0000-0000-0000-000000000002';
  v_post3_id uuid := '10000000-0000-0000-0000-000000000003';
  v_post4_id uuid := '10000000-0000-0000-0000-000000000004';
  v_post5_id uuid := '10000000-0000-0000-0000-000000000005';
  v_post6_id uuid := '10000000-0000-0000-0000-000000000006';
  v_post7_id uuid := '10000000-0000-0000-0000-000000000007';
  v_post8_id uuid := '10000000-0000-0000-0000-000000000008';
begin
  -- User 1: Elena Rodriguez
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token
  ) values (
    v_user1_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'elena@mikesta.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"elena_lens","display_name":"Elena Rodriguez"}',
    now() - interval '30 days',
    now(),
    ''
  ) on conflict (id) do nothing;

  -- User 2: Marcus Chen
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token
  ) values (
    v_user2_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'marcus@mikesta.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"marcus_creates","display_name":"Marcus Chen"}',
    now() - interval '25 days',
    now(),
    ''
  ) on conflict (id) do nothing;

  -- User 3: Maya Lin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token
  ) values (
    v_user3_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'maya@mikesta.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"maya_visuals","display_name":"Maya Lin"}',
    now() - interval '20 days',
    now(),
    ''
  ) on conflict (id) do nothing;

  -- User 4: Julian Vance
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token
  ) values (
    v_user4_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'julian@mikesta.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"julian_v","display_name":"Julian Vance"}',
    now() - interval '15 days',
    now(),
    ''
  ) on conflict (id) do nothing;

  -- 4. Seed Profiles
  insert into public.profiles (id, username, display_name, bio, avatar_url, created_at)
  values
    (
      v_user1_id,
      'elena_lens',
      'Elena Rodriguez',
      'Visual artist & architectural photographer in San Francisco. Documenting light, brutalist form, and quiet city spaces.',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      now() - interval '30 days'
    ),
    (
      v_user2_id,
      'marcus_creates',
      'Marcus Chen',
      'Coffee roaster & analog film enthusiast. Kyoto / Tokyo / Seattle. 35mm only.',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      now() - interval '25 days'
    ),
    (
      v_user3_id,
      'maya_visuals',
      'Maya Lin',
      'Ceramicist & botanical stylist. Exploring earthy textures and tactile everyday rituals.',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      now() - interval '20 days'
    ),
    (
      v_user4_id,
      'julian_v',
      'Julian Vance',
      'Nordic minimalism, brutalism, and Scandinavian design journals.',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      now() - interval '15 days'
    )
  on conflict (id) do update set
    username = excluded.username,
    display_name = excluded.display_name,
    bio = excluded.bio,
    avatar_url = excluded.avatar_url;

  -- 5. Seed Posts
  insert into public.posts (id, user_id, image_url, caption, location, created_at)
  values
    (
      v_post1_id,
      v_user1_id,
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
      'Morning geometry inside the cathedral of light. Captured on Hasselblad 500C. #minimalism #architecture #light',
      'San Francisco, CA',
      now() - interval '2 hours'
    ),
    (
      v_post2_id,
      v_user2_id,
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
      'Hand-dripped single origin Ethiopian natural roast. Quiet mornings in Gion before the alleyways awaken.',
      'Kyoto, Japan',
      now() - interval '6 hours'
    ),
    (
      v_post3_id,
      v_user3_id,
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80',
      'Fresh stoneware cups cooling after their high-fire glaze. Each piece holds its own fingerprint.',
      'Big Sur Craft Studio',
      now() - interval '18 hours'
    ),
    (
      v_post4_id,
      v_user4_id,
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      'Reflections and concrete monoliths under the Scandinavian winter sky. #brutalism #scandinavia',
      'Stockholm, Sweden',
      now() - interval '1 day'
    ),
    (
      v_post5_id,
      v_user1_id,
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
      'First mist lifting off the ridges. Silence is the best acoustic filter. #pacificnorthwest #wanderlust',
      'Olympic National Forest',
      now() - interval '2 days'
    ),
    (
      v_post6_id,
      v_user2_id,
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      'Design workshop table in Shibuya. Analog notebooks, fountain pens, and espresso.',
      'Shibuya, Tokyo',
      now() - interval '3 days'
    ),
    (
      v_post7_id,
      v_user3_id,
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
      'Earthy textiles and natural linen drape for the spring collection lookbook.',
      'Carmel-by-the-Sea',
      now() - interval '4 days'
    ),
    (
      v_post8_id,
      v_user4_id,
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80',
      'A solitary cabin in the snow. Wood smoke and warm tea.',
      'Tromso, Norway',
      now() - interval '5 days'
    )
  on conflict (id) do update set
    image_url = excluded.image_url,
    caption = excluded.caption,
    location = excluded.location;

  -- 6. Seed Comments
  insert into public.comments (user_id, post_id, body, created_at)
  values
    (v_user2_id, v_post1_id, 'The tonality on this is exquisite Elena!', now() - interval '1 hour'),
    (v_user3_id, v_post1_id, 'Incredible framing. Makes the space feel infinite.', now() - interval '45 minutes'),
    (v_user1_id, v_post2_id, 'Need to visit that spot next time I am in Kansai.', now() - interval '4 hours'),
    (v_user4_id, v_post2_id, 'What film stock did you shoot this on Marcus? Portra 400?', now() - interval '3 hours'),
    (v_user1_id, v_post3_id, 'That celadon glaze came out immaculate Maya!', now() - interval '12 hours'),
    (v_user2_id, v_post4_id, 'Brutalism done right. The angles are so clean.', now() - interval '18 hours'),
    (v_user3_id, v_post5_id, 'Pure atmosphere. You can smell the cedar pine from here.', now() - interval '1 day'),
    (v_user4_id, v_post6_id, 'The ultimate desk inspiration. Keep creating!', now() - interval '2 days');

  -- 7. Seed Likes
  insert into public.likes (user_id, post_id, created_at)
  values
    (v_user2_id, v_post1_id, now()),
    (v_user3_id, v_post1_id, now()),
    (v_user4_id, v_post1_id, now()),
    (v_user1_id, v_post2_id, now()),
    (v_user3_id, v_post2_id, now()),
    (v_user1_id, v_post3_id, now()),
    (v_user2_id, v_post3_id, now()),
    (v_user4_id, v_post3_id, now()),
    (v_user1_id, v_post4_id, now()),
    (v_user2_id, v_post4_id, now()),
    (v_user3_id, v_post5_id, now()),
    (v_user4_id, v_post5_id, now()),
    (v_user1_id, v_post6_id, now()),
    (v_user3_id, v_post6_id, now())
  on conflict (user_id, post_id) do nothing;

  -- 8. Seed Follows
  insert into public.follows (follower_id, following_id, created_at)
  values
    (v_user1_id, v_user2_id, now()),
    (v_user1_id, v_user3_id, now()),
    (v_user2_id, v_user1_id, now()),
    (v_user2_id, v_user4_id, now()),
    (v_user3_id, v_user1_id, now()),
    (v_user3_id, v_user2_id, now()),
    (v_user4_id, v_user1_id, now())
  on conflict (follower_id, following_id) do nothing;

end $$;

-- Verify seeded records
select 'Profiles count: ' || count(*)::text as result from public.profiles
union all
select 'Posts count: ' || count(*)::text from public.posts
union all
select 'Comments count: ' || count(*)::text from public.comments
union all
select 'Likes count: ' || count(*)::text from public.likes
union all
select 'Follows count: ' || count(*)::text from public.follows;

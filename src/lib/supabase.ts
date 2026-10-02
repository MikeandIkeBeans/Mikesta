import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://rzrxljijijowmfoedwoe.supabase.co',
  'sb_publishable_1nJN7L3LOtAb_dwqguZtfw_nJpxPwm5'
);

export type UserProfile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

export type FeedPost = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  location: string | null;
  created_at: string;
  profiles: Pick<UserProfile, 'username' | 'display_name' | 'avatar_url'> | null;
  likes: number;
  comments: number;
  liked: boolean;
  saved: boolean;
};

export type Comment = {
  id: number;
  body: string;
  created_at: string;
  profiles: Pick<UserProfile, 'username'> | null;
};

export const messageFor = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong.';

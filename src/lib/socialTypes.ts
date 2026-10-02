
export interface Story {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  story_image: string;
  caption?: string;
  created_at: string;
  seen?: boolean;
}

export interface NotificationItem {
  id: string;
  user: {
    username: string;
    avatar_url: string;
  };
  action: 'like' | 'comment' | 'follow' | 'save';
  target?: string;
  time: string;
  read: boolean;
}

export interface SuggestedUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  reason: string;
  following: boolean;
}

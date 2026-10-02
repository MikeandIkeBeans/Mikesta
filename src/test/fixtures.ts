import { Comment, FeedPost, UserProfile } from '../lib/supabase';
import { Story, NotificationItem, SuggestedUser } from '../lib/socialTypes';
export const SEED_PROFILES: UserProfile[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    username: 'elena_lens',
    display_name: 'Elena Rodriguez',
    bio: 'Visual artist & architectural photographer in San Francisco. Documenting light, brutalist form, and quiet city spaces.',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    username: 'marcus_creates',
    display_name: 'Marcus Chen',
    bio: 'Coffee roaster & analog film enthusiast. Kyoto / Tokyo / Seattle. 35mm only.',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    username: 'maya_visuals',
    display_name: 'Maya Lin',
    bio: 'Ceramicist & botanical stylist. Exploring earthy textures and tactile everyday rituals.',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'd4444444-4444-4444-4444-444444444444',
    username: 'julian_v',
    display_name: 'Julian Vance',
    bio: 'Nordic minimalism, brutalism, and Scandinavian design journals.',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'e5555555-5555-5555-5555-555555555555',
    username: 'ariapatel',
    display_name: 'Aria Patel',
    bio: 'Documentary photographer exploring coastal cultures and hidden harbors.',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  },
];

export const CURRENT_DEMO_USER = SEED_PROFILES[0];

export const SEED_POSTS: FeedPost[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    user_id: 'a1111111-1111-1111-1111-111111111111',
    image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    caption: 'Morning geometry inside the cathedral of light. Captured on Hasselblad 500C. #minimalism #architecture #light',
    location: 'San Francisco, CA',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    profiles: {
      username: 'elena_lens',
      display_name: 'Elena Rodriguez',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
    likes: 142,
    comments: 2,
    liked: false,
    saved: false,
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    user_id: 'b2222222-2222-2222-2222-222222222222',
    image_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
    caption: 'Hand-dripped single origin Ethiopian natural roast. Quiet mornings in Gion before the alleyways awaken.',
    location: 'Kyoto, Japan',
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    profiles: {
      username: 'marcus_creates',
      display_name: 'Marcus Chen',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    },
    likes: 289,
    comments: 2,
    liked: true,
    saved: false,
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    user_id: 'c3333333-3333-3333-3333-333333333333',
    image_url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80',
    caption: 'Fresh stoneware cups cooling after their high-fire glaze. Each piece holds its own fingerprint.',
    location: 'Big Sur Craft Studio',
    created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    profiles: {
      username: 'maya_visuals',
      display_name: 'Maya Lin',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    },
    likes: 418,
    comments: 1,
    liked: false,
    saved: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    user_id: 'd4444444-4444-4444-4444-444444444444',
    image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    caption: 'Reflections and concrete monoliths under the Scandinavian winter sky. #brutalism #scandinavia',
    location: 'Stockholm, Sweden',
    created_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    profiles: {
      username: 'julian_v',
      display_name: 'Julian Vance',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    },
    likes: 195,
    comments: 1,
    liked: false,
    saved: false,
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    user_id: 'a1111111-1111-1111-1111-111111111111',
    image_url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
    caption: 'First mist lifting off the ridges. Silence is the best acoustic filter. #pacificnorthwest #wanderlust',
    location: 'Olympic National Forest',
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    profiles: {
      username: 'elena_lens',
      display_name: 'Elena Rodriguez',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
    likes: 512,
    comments: 1,
    liked: true,
    saved: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    user_id: 'e5555555-5555-5555-5555-555555555555',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    caption: 'Tides receding at sunset. The natural gradients never need retouching. #seascapes #documentary',
    location: 'Mendocino Headlands',
    created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    profiles: {
      username: 'ariapatel',
      display_name: 'Aria Patel',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    },
    likes: 367,
    comments: 1,
    liked: false,
    saved: false,
  },
];

export const SEED_COMMENTS: Record<string, Comment[]> = {
  '10000000-0000-0000-0000-000000000001': [
    {
      id: 1,
      body: 'The tonality on this is exquisite Elena!',
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      profiles: { username: 'marcus_creates' },
    },
    {
      id: 2,
      body: 'Incredible framing. Makes the space feel infinite.',
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      profiles: { username: 'maya_visuals' },
    },
  ],
  '10000000-0000-0000-0000-000000000002': [
    {
      id: 3,
      body: 'Need to visit that spot next time I am in Kansai.',
      created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      profiles: { username: 'elena_lens' },
    },
    {
      id: 4,
      body: 'What film stock did you shoot this on Marcus? Portra 400?',
      created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      profiles: { username: 'julian_v' },
    },
  ],
  '10000000-0000-0000-0000-000000000003': [
    {
      id: 5,
      body: 'That celadon glaze came out immaculate Maya!',
      created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      profiles: { username: 'elena_lens' },
    },
  ],
  '10000000-0000-0000-0000-000000000004': [
    {
      id: 6,
      body: 'Brutalism done right. The angles are so clean.',
      created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      profiles: { username: 'marcus_creates' },
    },
  ],
  '10000000-0000-0000-0000-000000000005': [
    {
      id: 7,
      body: 'Pure atmosphere. You can smell the cedar pine from here.',
      created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      profiles: { username: 'maya_visuals' },
    },
  ],
  '10000000-0000-0000-0000-000000000006': [
    {
      id: 8,
      body: 'Such soft golden light Aria. Beautiful composition.',
      created_at: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
      profiles: { username: 'julian_v' },
    },
  ],
};

export const SEED_STORIES: Story[] = [
  {
    id: 's1',
    user_id: 'b2222222-2222-2222-2222-222222222222',
    username: 'marcus_creates',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    story_image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    caption: 'Setting up darkroom equipment for tonight’s print run 🎞️',
    created_at: '2h ago',
    seen: false,
  },
  {
    id: 's2',
    user_id: 'c3333333-3333-3333-3333-333333333333',
    username: 'maya_visuals',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    story_image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    caption: 'Fresh clay arrived from Sonoma County. Studio smells like rain. 🌿',
    created_at: '4h ago',
    seen: false,
  },
  {
    id: 's3',
    user_id: 'd4444444-4444-4444-4444-444444444444',
    username: 'julian_v',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    story_image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80',
    caption: 'First snowfall in the fjord. Cabin warm and quiet. ❄️',
    created_at: '7h ago',
    seen: false,
  },
  {
    id: 's4',
    user_id: 'e5555555-5555-5555-5555-555555555555',
    username: 'ariapatel',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    story_image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    caption: 'Sunrise over coastal fog bank. Always worth waking up early.',
    created_at: '9h ago',
    seen: false,
  },
];

export const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    user: {
      username: 'marcus_creates',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    },
    action: 'like',
    target: 'your photo "Morning geometry"',
    time: '25m ago',
    read: false,
  },
  {
    id: 'n2',
    user: {
      username: 'maya_visuals',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    },
    action: 'comment',
    target: '"Incredible framing. Makes the space feel infinite."',
    time: '1h ago',
    read: false,
  },
  {
    id: 'n3',
    user: {
      username: 'julian_v',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    },
    action: 'follow',
    time: '3h ago',
    read: true,
  },
  {
    id: 'n4',
    user: {
      username: 'ariapatel',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    },
    action: 'save',
    target: 'your photo "First mist lifting"',
    time: '5h ago',
    read: true,
  },
];

export const SEED_SUGGESTIONS: SuggestedUser[] = [
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    username: 'marcus_creates',
    display_name: 'Marcus Chen',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    reason: 'Follows film photography',
    following: true,
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    username: 'maya_visuals',
    display_name: 'Maya Lin',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    reason: 'Popular in Ceramics & Design',
    following: true,
  },
  {
    id: 'd4444444-4444-4444-4444-444444444444',
    username: 'julian_v',
    display_name: 'Julian Vance',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    reason: 'New to Mikesta',
    following: false,
  },
  {
    id: 'e5555555-5555-5555-5555-555555555555',
    username: 'ariapatel',
    display_name: 'Aria Patel',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    reason: 'Followed by marcus_creates',
    following: false,
  },
];

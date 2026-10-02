import {
  Comment,
  FeedPost,
  UserProfile,
  supabase,
} from './supabase';
import {
  CURRENT_DEMO_USER,
  NotificationItem,
  SEED_COMMENTS,
  SEED_NOTIFICATIONS,
  SEED_POSTS,
  SEED_PROFILES,
  SEED_STORIES,
  SEED_SUGGESTIONS,
  Story,
  SuggestedUser,
} from './mockData';
import { compressImage } from './imageUtils';

const STORAGE_KEYS = {
  POSTS: 'mikesta_posts_v2',
  COMMENTS: 'mikesta_comments_v2',
  SAVED_POST_IDS: 'mikesta_saved_post_ids_v2',
  CURRENT_USER: 'mikesta_current_user_v2',
  STORIES: 'mikesta_stories_v2',
  NOTIFICATIONS: 'mikesta_notifications_v2',
  SUGGESTIONS: 'mikesta_suggestions_v2',
  FOLLOWING_IDS: 'mikesta_following_ids_v2',
  INTERACTIONS_BY_USER: 'mikesta_interactions_by_user_v1',
  THEME: 'mikesta_theme_v2',
};

type UserInteractionState = {
  likedPostIds: string[];
  savedPostIds: string[];
  followingUserIds: string[];
};

function cloneSeedData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Failed reading ${key} from storage:`, err);
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err: any) {
    if (err?.name === 'QuotaExceededError' || err?.code === 22) {
      console.warn(`Storage quota exceeded for ${key}, trimming oldest local cache...`);
      try {
        if (Array.isArray(value) && value.length > 8) {
          const trimmed = value.slice(0, 8);
          localStorage.setItem(key, JSON.stringify(trimmed));
        }
      } catch {}
    } else {
      console.warn(`Failed saving ${key} to storage:`, err);
    }
  }
}

export type FeedFilter = 'following' | 'foryou' | 'recent';

export class MikestaStore {
  // State
  private posts: FeedPost[] = [];
  private comments: Record<string, Comment[]> = {};
  private savedPostIds: Set<string> = new Set();
  private currentUser: UserProfile | null = null;
  private isSupabaseUser = false;
  private stories: Story[] = [];
  private notifications: NotificationItem[] = [];
  private suggestions: SuggestedUser[] = [];
  private followingUserIds: Set<string> = new Set();
  private interactionsByUser: Record<string, UserInteractionState> = {};
  private theme: 'light' | 'dark' = 'light';
  private isOnline = true;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    this.posts = getStored<FeedPost[]>(STORAGE_KEYS.POSTS, cloneSeedData(SEED_POSTS));
    this.comments = getStored<Record<string, Comment[]>>(STORAGE_KEYS.COMMENTS, cloneSeedData(SEED_COMMENTS));
    const savedIds = getStored<string[]>(STORAGE_KEYS.SAVED_POST_IDS, [
      '10000000-0000-0000-0000-000000000003',
      '10000000-0000-0000-0000-000000000005',
    ]);
    this.savedPostIds = new Set(savedIds);
    this.currentUser = getStored<UserProfile>(STORAGE_KEYS.CURRENT_USER, CURRENT_DEMO_USER);
    this.stories = getStored<Story[]>(STORAGE_KEYS.STORIES, cloneSeedData(SEED_STORIES));
    this.notifications = getStored<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, cloneSeedData(SEED_NOTIFICATIONS));
    this.suggestions = getStored<SuggestedUser[]>(STORAGE_KEYS.SUGGESTIONS, cloneSeedData(SEED_SUGGESTIONS));

    const followingIds = getStored<string[]>(
      STORAGE_KEYS.FOLLOWING_IDS,
      this.suggestions.filter((s) => s.following).map((s) => s.id)
    );
    this.followingUserIds = new Set(followingIds);
    this.interactionsByUser = getStored<Record<string, UserInteractionState>>(
      STORAGE_KEYS.INTERACTIONS_BY_USER,
      {}
    );
    if (this.currentUser) {
      const storedInteractions = this.interactionsByUser[this.currentUser.id];
      if (storedInteractions) {
        this.restoreInteractionState(storedInteractions);
      } else {
        this.captureInteractionState();
      }
    }

    this.theme = getStored<'light' | 'dark'>(STORAGE_KEYS.THEME, 'light');
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', this.theme);
    }

    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      this.isOnline = navigator.onLine;
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notify();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notify();
      });
    }

    this.syncPostFlags();
  }

  private syncPostFlags() {
    this.posts = this.posts.map((p) => ({
      ...p,
      saved: this.savedPostIds.has(p.id),
    }));
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.syncPostFlags();
    this.persist();
    for (const listener of this.listeners) {
      listener();
    }
  }

  private persist() {
    this.captureInteractionState();
    setStored(STORAGE_KEYS.POSTS, this.posts);
    setStored(STORAGE_KEYS.COMMENTS, this.comments);
    setStored(STORAGE_KEYS.SAVED_POST_IDS, Array.from(this.savedPostIds));
    setStored(STORAGE_KEYS.CURRENT_USER, this.currentUser);
    setStored(STORAGE_KEYS.STORIES, this.stories);
    setStored(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    setStored(STORAGE_KEYS.SUGGESTIONS, this.suggestions);
    setStored(STORAGE_KEYS.FOLLOWING_IDS, Array.from(this.followingUserIds));
    setStored(STORAGE_KEYS.INTERACTIONS_BY_USER, this.interactionsByUser);
    setStored(STORAGE_KEYS.THEME, this.theme);
  }

  private captureInteractionState() {
    if (!this.currentUser) return;
    this.interactionsByUser[this.currentUser.id] = {
      likedPostIds: this.posts.filter((post) => post.liked).map((post) => post.id),
      savedPostIds: Array.from(this.savedPostIds),
      followingUserIds: Array.from(this.followingUserIds),
    };
  }

  private restoreInteractionState(state: UserInteractionState) {
    const likedPostIds = new Set(state.likedPostIds);
    this.savedPostIds = new Set(state.savedPostIds);
    this.followingUserIds = new Set(state.followingUserIds);
    this.posts = this.posts.map((post) => ({ ...post, liked: likedPostIds.has(post.id) }));
    this.suggestions = this.suggestions.map((suggestion) => ({
      ...suggestion,
      following: this.followingUserIds.has(suggestion.id),
    }));
  }

  public async syncWithSupabase(): Promise<void> {
    try {
      const { data: supaUser } = await supabase.auth.getUser();
      if (supaUser?.user) {
        this.isSupabaseUser = true;
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supaUser.user.id)
          .maybeSingle();

        if (prof) {
          this.currentUser = prof as UserProfile;
        } else {
          const username =
            supaUser.user.user_metadata?.username ||
            supaUser.user.email?.split('@')[0] ||
            `user_${supaUser.user.id.slice(0, 6)}`;
          const fallbackProf: UserProfile = {
            id: supaUser.user.id,
            username,
            display_name: username,
            bio: 'Creator on Mikesta.',
            avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80`,
          };
          this.currentUser = fallbackProf;
        }

        this.restoreInteractionState(
          this.interactionsByUser[this.currentUser.id] || {
            likedPostIds: [],
            savedPostIds: [],
            followingUserIds: [],
          }
        );
      }

      const { data: supaPosts, error: postErr } = await supabase
        .from('posts')
        .select('id, user_id, image_url, caption, location, created_at, profiles(username, display_name, avatar_url)')
        .order('created_at', { ascending: false });

      if (!postErr && supaPosts && supaPosts.length > 0) {
        const formatted: FeedPost[] = await Promise.all(
          supaPosts.map(async (row: any) => {
            const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
            const [likesRes, commentRes] = await Promise.all([
              supabase.from('likes').select('post_id', { count: 'exact', head: true }).eq('post_id', row.id),
              supabase.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', row.id),
            ]);

            return {
              id: row.id,
              user_id: row.user_id,
              image_url: row.image_url,
              caption: row.caption,
              location: row.location,
              created_at: row.created_at,
              profiles: prof,
              likes: likesRes.count || 0,
              comments: commentRes.count || 0,
              liked: this.currentUser
                ? this.interactionsByUser[this.currentUser.id]?.likedPostIds.includes(row.id) || false
                : false,
              saved: this.savedPostIds.has(row.id),
            };
          })
        );

        const supaIds = new Set(formatted.map((p) => p.id));
        const combined = [...formatted, ...this.posts.filter((p) => !supaIds.has(p.id))];
        this.posts = combined;
        this.notify();
      }
    } catch (err) {
      console.warn('Supabase sync skipped / offline fallback active:', err);
    }
  }

  // Getters
  public getPosts(): FeedPost[] {
    return this.posts;
  }

  public getFilteredPosts(filter: FeedFilter, search = ''): FeedPost[] {
    let result = [...this.posts];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.caption?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          p.profiles?.username?.toLowerCase().includes(q) ||
          p.profiles?.display_name?.toLowerCase().includes(q)
      );
    }

    if (filter === 'following') {
      result = result.filter(
        (p) => this.followingUserIds.has(p.user_id) || p.user_id === this.currentUser?.id
      );
    } else if (filter === 'foryou') {
      result.sort((a, b) => (b.likes + b.comments * 3) - (a.likes + a.comments * 3));
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }

  public getSavedPosts(): FeedPost[] {
    return this.posts.filter((p) => this.savedPostIds.has(p.id));
  }

  public getUserPosts(userId?: string): FeedPost[] {
    const id = userId || this.currentUser?.id;
    if (!id) return [];
    return this.posts.filter((p) => p.user_id === id);
  }

  public getProfileByUsername(username: string): UserProfile | null {
    if (this.currentUser && this.currentUser.username.toLowerCase() === username.toLowerCase()) {
      return this.currentUser;
    }
    const seed = SEED_PROFILES.find((p) => p.username.toLowerCase() === username.toLowerCase());
    if (seed) return seed;

    const postWithProf = this.posts.find(
      (p) => p.profiles?.username?.toLowerCase() === username.toLowerCase()
    );
    if (postWithProf && postWithProf.profiles) {
      return {
        id: postWithProf.user_id,
        username: postWithProf.profiles.username,
        display_name: postWithProf.profiles.display_name,
        bio: 'Visual creator on Mikesta.',
        avatar_url: postWithProf.profiles.avatar_url,
      };
    }
    return null;
  }

  public getPostsByUsername(username: string): FeedPost[] {
    return this.posts.filter(
      (p) => p.profiles?.username?.toLowerCase() === username.toLowerCase()
    );
  }

  public getComments(postId: string): Comment[] {
    return this.comments[postId] || [];
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public getStories(): Story[] {
    return this.stories;
  }

  public getNotifications(): NotificationItem[] {
    return this.notifications;
  }

  public getUnreadNotificationCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  public getSuggestions(): SuggestedUser[] {
    return this.suggestions;
  }

  public isFollowing(userId: string): boolean {
    return this.followingUserIds.has(userId);
  }

  public getAvailableProfiles(): UserProfile[] {
    return SEED_PROFILES;
  }

  public getTheme(): 'light' | 'dark' {
    return this.theme;
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  private canSyncWithSupabase(): boolean {
    return this.isSupabaseUser;
  }

  // Mutations
  public toggleTheme(): 'light' | 'dark' {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', this.theme);
    }
    this.notify();
    return this.theme;
  }

  public switchUser(user: UserProfile, isRemoteUser = false) {
    this.captureInteractionState();
    this.isSupabaseUser = isRemoteUser;
    this.currentUser = user;
    this.restoreInteractionState(
      this.interactionsByUser[user.id] || {
        likedPostIds: [],
        savedPostIds: [],
        followingUserIds: [],
      }
    );
    this.notify();
  }

  public async updateProfile(updates: Partial<UserProfile>, avatarFile?: File | null): Promise<UserProfile> {
    if (!this.currentUser) throw new Error('No user signed in');

    if (avatarFile) {
      if (this.canSyncWithSupabase()) {
        const path = `${this.currentUser.id}/${crypto.randomUUID()}-${avatarFile.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
        const upload = await supabase.storage.from('posts').upload(path, avatarFile, {
          contentType: avatarFile.type,
          upsert: true,
        });
        if (upload.error) throw upload.error;
        const { data } = supabase.storage.from('posts').getPublicUrl(path);
        updates = { ...updates, avatar_url: data.publicUrl };
      } else {
        updates = { ...updates, avatar_url: await compressImage(avatarFile, 512, 512, 0.86) };
      }
    }

    const updated: UserProfile = {
      ...this.currentUser,
      ...updates,
    };
    if (this.canSyncWithSupabase()) {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: updated.username,
          display_name: updated.display_name,
          bio: updated.bio,
          avatar_url: updated.avatar_url,
        })
        .eq('id', updated.id);
      if (error) throw error;
    }

    this.currentUser = updated;

    this.posts = this.posts.map((p) => {
      if (p.user_id === updated.id) {
        return {
          ...p,
          profiles: {
            username: updated.username,
            display_name: updated.display_name,
            avatar_url: updated.avatar_url,
          },
        };
      }
      return p;
    });

    this.notify();
    return updated;
  }

  public toggleLike(postId: string): boolean {
    let nowLiked = false;
    this.posts = this.posts.map((p) => {
      if (p.id === postId) {
        nowLiked = !p.liked;
        return {
          ...p,
          liked: nowLiked,
          likes: p.likes + (nowLiked ? 1 : -1),
        };
      }
      return p;
    });

    if (this.currentUser && this.canSyncWithSupabase()) {
      const q = supabase.from('likes');
      if (nowLiked) {
        q.insert({ user_id: this.currentUser.id, post_id: postId }).then();
      } else {
        q.delete().eq('user_id', this.currentUser.id).eq('post_id', postId).then();
      }
    }

    this.notify();
    return nowLiked;
  }

  public toggleSave(postId: string): boolean {
    const isSaved = this.savedPostIds.has(postId);
    if (isSaved) {
      this.savedPostIds.delete(postId);
    } else {
      this.savedPostIds.add(postId);
    }

    if (this.currentUser && this.canSyncWithSupabase()) {
      const q = supabase.from('saved_posts');
      if (!isSaved) {
        q.insert({ user_id: this.currentUser.id, post_id: postId }).then();
      } else {
        q.delete().eq('user_id', this.currentUser.id).eq('post_id', postId).then();
      }
    }

    this.notify();
    return !isSaved;
  }

  public async addComment(postId: string, text: string): Promise<Comment> {
    if (!this.currentUser) throw new Error('Sign in to leave a comment');
    const trimmed = text.trim();
    if (!trimmed) throw new Error('Comment cannot be empty');
    if (trimmed.length > 180) throw new Error('Comment must be 180 characters or fewer');

    const newComment: Comment = {
      id: Date.now(),
      body: trimmed,
      created_at: new Date().toISOString(),
      profiles: {
        username: this.currentUser.username,
      },
    };

    const currentList = this.comments[postId] || [];
    this.comments[postId] = [...currentList, newComment];

    this.posts = this.posts.map((p) => {
      if (p.id === postId) {
        return { ...p, comments: p.comments + 1 };
      }
      return p;
    });

    if (this.canSyncWithSupabase()) {
      await supabase.from('comments').insert({
        user_id: this.currentUser.id,
        post_id: postId,
        body: trimmed,
      });
    }

    this.notify();
    return newComment;
  }

  public deleteComment(postId: string, commentId: number | string): void {
    const list = this.comments[postId] || [];
    this.comments[postId] = list.filter((c) => c.id !== commentId);

    this.posts = this.posts.map((p) => {
      if (p.id === postId) {
        return { ...p, comments: Math.max(0, p.comments - 1) };
      }
      return p;
    });

    if (this.currentUser && this.canSyncWithSupabase()) {
      supabase.from('comments').delete().eq('id', commentId).then();
    }

    this.notify();
  }

  public toggleFollow(userId: string): boolean {
    const isFollow = this.followingUserIds.has(userId);
    if (isFollow) {
      this.followingUserIds.delete(userId);
    } else {
      this.followingUserIds.add(userId);
    }

    this.suggestions = this.suggestions.map((s) => {
      if (s.id === userId) {
        return { ...s, following: !isFollow };
      }
      return s;
    });

    if (this.currentUser && this.canSyncWithSupabase()) {
      const q = supabase.from('follows');
      if (!isFollow) {
        q.insert({ follower_id: this.currentUser.id, following_id: userId }).then();
      } else {
        q.delete().eq('follower_id', this.currentUser.id).eq('following_id', userId).then();
      }
    }

    this.notify();
    return !isFollow;
  }

  public async createPost(params: {
    file?: File | null;
    imageUrl?: string;
    caption: string;
    location?: string;
    filterCss?: string;
  }): Promise<FeedPost> {
    if (!this.currentUser) throw new Error('Sign in to create a post');

    let resolvedImageUrl = params.imageUrl || '';

    if (params.file) {
      if (!params.filterCss || params.filterCss === 'none') {
        if (this.canSyncWithSupabase()) {
          try {
          const path = `${this.currentUser.id}/${crypto.randomUUID()}-${params.file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
          const upload = await supabase.storage.from('posts').upload(path, params.file, {
            contentType: params.file.type,
          });

          if (!upload.error) {
            const { data: publicData } = supabase.storage.from('posts').getPublicUrl(path);
            if (publicData?.publicUrl) {
              resolvedImageUrl = publicData.publicUrl;
            }
          }
          } catch (err) {
            console.warn('Supabase storage upload failed, compressing locally:', err);
          }
        }
      }

      if (!resolvedImageUrl) {
        try {
          resolvedImageUrl = await compressImage(params.file, 1440, 1440, 0.84, params.filterCss);
        } catch {
          resolvedImageUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () =>
              resolve('https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80');
            reader.readAsDataURL(params.file!);
          });
        }
      }
    }

    if (!resolvedImageUrl) {
      throw new Error('Please choose an image for your post.');
    }

    const postId = crypto.randomUUID();
    const newPost: FeedPost = {
      id: postId,
      user_id: this.currentUser.id,
      image_url: resolvedImageUrl,
      caption: params.caption.trim(),
      location: params.location?.trim() || null,
      created_at: new Date().toISOString(),
      profiles: {
        username: this.currentUser.username,
        display_name: this.currentUser.display_name,
        avatar_url: this.currentUser.avatar_url,
      },
      likes: 0,
      comments: 0,
      liked: false,
      saved: false,
    };

    this.posts = [newPost, ...this.posts];

    if (this.canSyncWithSupabase()) {
      await supabase.from('posts').insert({
        id: postId,
        user_id: this.currentUser.id,
        image_url: resolvedImageUrl,
        caption: params.caption.trim(),
        location: params.location?.trim() || null,
      });
    }

    this.notify();
    return newPost;
  }

  public deletePost(postId: string): void {
    this.posts = this.posts.filter((p) => p.id !== postId);
    this.savedPostIds.delete(postId);
    delete this.comments[postId];

    if (this.currentUser && this.canSyncWithSupabase()) {
      supabase.from('posts').delete().eq('id', postId).eq('user_id', this.currentUser.id).then();
    }

    this.notify();
  }

  public addStory(params: { imageUrl: string; caption?: string }): Story {
    if (!this.currentUser) throw new Error('Sign in to share a story');

    const newStory: Story = {
      id: `story_${Date.now()}`,
      user_id: this.currentUser.id,
      username: this.currentUser.username,
      avatar_url:
        this.currentUser.avatar_url ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      story_image: params.imageUrl,
      caption: params.caption,
      created_at: 'Just now',
      seen: false,
    };

    this.stories = [newStory, ...this.stories];
    this.notify();
    return newStory;
  }

  public markStorySeen(storyId: string) {
    this.stories = this.stories.map((s) => (s.id === storyId ? { ...s, seen: true } : s));
    this.notify();
  }

  public markAllNotificationsRead() {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
    this.notify();
  }

  public resetToSeedData() {
    this.posts = cloneSeedData(SEED_POSTS);
    this.comments = cloneSeedData(SEED_COMMENTS);
    this.savedPostIds = new Set([
      '10000000-0000-0000-0000-000000000003',
      '10000000-0000-0000-0000-000000000005',
    ]);
    this.currentUser = CURRENT_DEMO_USER;
    this.stories = cloneSeedData(SEED_STORIES);
    this.notifications = cloneSeedData(SEED_NOTIFICATIONS);
    this.suggestions = cloneSeedData(SEED_SUGGESTIONS);
    this.followingUserIds = new Set(this.suggestions.filter((s) => s.following).map((s) => s.id));
    this.interactionsByUser = {};
    this.notify();
  }
}

export const store = new MikestaStore();

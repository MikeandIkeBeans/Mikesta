import { Comment, FeedPost, UserProfile, supabase } from './supabase';
import type { NotificationItem, Story, SuggestedUser } from './socialTypes';

export type FeedFilter = 'following' | 'foryou' | 'recent';
export type AuthStatus = 'loading' | 'signedOut' | 'signedIn' | 'passwordRecovery' | 'error';
export const errorMessage = (error: unknown) => error && typeof error === 'object' && 'message' in error
  ? String(error.message) : 'Could not reach Supabase. Please try again.';

export class MikestaStore {
  private posts: FeedPost[] = [];
  private profiles: UserProfile[] = [];
  private comments: Record<string, Comment[]> = {};
  private savedPostIds = new Set<string>();
  private followingUserIds = new Set<string>();
  private likers: Record<string, string[]> = {};
  private currentUser: UserProfile | null = null;
  private stories: Story[] = [];
  private notifications: NotificationItem[] = [];
  private suggestions: SuggestedUser[] = [];
  private theme: 'light' | 'dark' = 'light';
  private isOnline = typeof navigator === 'undefined' || navigator.onLine;
  private listeners = new Set<() => void>();
  private authStatus: AuthStatus = 'loading';
  private syncError = '';
  private generation = 0;
  private passwordRecovery = typeof window !== 'undefined' && window.location.pathname === '/reset-password';

  constructor() {
    try { this.theme = localStorage.getItem('mikesta_theme_v2') === '"dark"' ? 'dark' : 'light'; } catch {}
    if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', this.theme);
  }

  public subscribe(listener: () => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  private notify() { this.listeners.forEach((listener) => listener()); }
  private clearData() {
    this.posts = []; this.profiles = []; this.comments = {}; this.suggestions = [];
    this.savedPostIds.clear(); this.followingUserIds.clear(); this.currentUser = null;
    this.stories = []; this.notifications = []; this.likers = {}; this.follows = [];
  }
  public getAuthStatus() { return this.authStatus; }
  public getSyncError() { return this.syncError; }

  public startAuth() {
    let active = true;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (!active) return;
      if (event === 'SIGNED_OUT') {
        this.passwordRecovery = false;
        this.generation++; this.clearData(); this.authStatus = 'signedOut'; this.syncError = ''; this.notify();
      } else {
        if (event === 'PASSWORD_RECOVERY') this.passwordRecovery = true;
        // Supabase auth callbacks must not await another auth request.
        queueMicrotask(() => { if (active) void this.syncWithSupabase(); });
      }
    });
    void this.syncWithSupabase();
    const online = () => { this.isOnline = true; this.notify(); void this.syncWithSupabase(); };
    const offline = () => { this.isOnline = false; this.notify(); };
    window.addEventListener('online', online); window.addEventListener('offline', offline);
    return () => {
      active = false; data.subscription.unsubscribe(); this.generation++;
      window.removeEventListener('online', online); window.removeEventListener('offline', offline);
    };
  }

  public async syncWithSupabase(): Promise<void> {
    const generation = ++this.generation;
    this.authStatus = 'loading'; this.syncError = ''; this.notify();
    try {
      const session = await supabase.auth.getSession();
      if (session.error) throw session.error;
      if (!session.data.session) {
        if (generation !== this.generation) return;
        const callback = new URLSearchParams(window.location.hash.slice(1));
        if (callback.has('error') || callback.has('error_code')) {
          // Consume a failed callback once; retrying must not reuse its URL error.
          window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
          throw new Error(callback.get('error_code') === 'otp_expired'
            ? 'This email link is invalid, expired, or already used. Try signing in, or request a new email below.'
            : callback.get('error_description') || 'Email confirmation failed. Request a new confirmation email below.');
        }
        if (this.passwordRecovery) throw new Error('This password reset link has no active session. Use Forgot password to request a new link.');
        this.clearData(); this.authStatus = 'signedOut'; this.notify(); return;
      }
      const authentication = await supabase.auth.getUser();
      if (authentication.error) throw authentication.error;
      const user = authentication.data.user;
      if (!user) throw new Error('Please sign in again.');
      if (this.passwordRecovery) {
        if (generation !== this.generation) return;
        this.clearData(); this.authStatus = 'passwordRecovery'; this.notify(); return;
      }
      const results = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('posts').select('id,user_id,image_url,caption,location,created_at,profiles(username,display_name,avatar_url)').order('created_at', { ascending: false }),
        supabase.from('likes').select('post_id,user_id'),
        supabase.from('comments').select('id,post_id,body,created_at,profiles(username)').order('created_at'),
        supabase.from('saved_posts').select('post_id').eq('user_id', user.id),
        supabase.from('follows').select('follower_id,following_id'),
      ]);
      for (const result of results) if (result.error) throw result.error;
      if (generation !== this.generation) return;
      const [profiles, posts, likes, comments, saved, follows] = results.map((result) => result.data || []);
      const profile = profiles.find((row: any) => row.id === user.id);
      if (!profile) throw new Error('Your account profile is missing. Please contact support.');
      this.clearData(); this.profiles = profiles as UserProfile[]; this.currentUser = profile as UserProfile;
      this.savedPostIds = new Set(saved.map((row: any) => row.post_id));
      this.followingUserIds = new Set(follows.filter((row: any) => row.follower_id === user.id).map((row: any) => row.following_id));
      for (const row of comments as any[]) {
        const author = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        (this.comments[row.post_id] ||= []).push({ id: row.id, body: row.body, created_at: row.created_at, profiles: author });
      }
      for (const like of likes as any[]) (this.likers[like.post_id] ||= []).push(like.user_id);
      this.posts = (posts as any[]).map((row) => ({ ...row,
        profiles: Array.isArray(row.profiles) ? row.profiles[0] : row.profiles,
        likes: likes.filter((like: any) => like.post_id === row.id).length,
        comments: (this.comments[row.id] || []).length,
        liked: likes.some((like: any) => like.post_id === row.id && like.user_id === user.id),
        saved: this.savedPostIds.has(row.id),
      }));
      this.suggestions = this.profiles.filter((profile) => profile.id !== user.id).map((profile) => ({
        id: profile.id, username: profile.username, display_name: profile.display_name || profile.username,
        avatar_url: profile.avatar_url || '', reason: 'Creator on Mikesta', following: this.followingUserIds.has(profile.id),
      }));
      this.follows = follows as { follower_id: string; following_id: string }[];
      this.authStatus = 'signedIn'; this.notify();
    } catch (error) {
      if (generation !== this.generation) return;
      this.clearData(); this.authStatus = 'error'; this.syncError = errorMessage(error); this.notify();
    }
  }
  private follows: { follower_id: string; following_id: string }[] = [];
  public getFollowerCount(id: string) { return this.follows.filter((row) => row.following_id === id).length; }
  public getFollowingCount(id: string) { return this.follows.filter((row) => row.follower_id === id).length; }
  public getLikedProfiles(id: string) { return this.profiles.filter((profile) => (this.likers[id] || []).includes(profile.id)); }
  private requireUser() {
    if (!this.currentUser || this.authStatus !== 'signedIn') throw new Error('Please sign in to continue.');
    return this.currentUser;
  }
  private check(result: { error: unknown }) { if (result.error) throw result.error; }
  public async resetPassword(password: string) {
    if (this.authStatus !== 'passwordRecovery') throw new Error('Open a valid password reset link first.');
    if (password.length < 6) throw new Error('Use at least 6 characters for your password.');
    this.check(await supabase.auth.updateUser({ password }));
    this.passwordRecovery = false;
    window.history.replaceState(window.history.state, '', '/');
    await this.syncWithSupabase();
  }
  public async signOut() { const result = await supabase.auth.signOut(); this.check(result); this.generation++; this.clearData(); this.authStatus = 'signedOut'; this.notify(); }
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
    const profile = this.profiles.find((p) => p.username.toLowerCase() === username.toLowerCase());
    if (profile) return profile;

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
    return this.profiles;
  }

  public getTheme(): 'light' | 'dark' {
    return this.theme;
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  public toggleTheme(): 'light' | 'dark' {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this.theme);
    try { localStorage.setItem('mikesta_theme_v2', JSON.stringify(this.theme)); } catch {}
    this.notify(); return this.theme;
  }
  private async upload(file: File) {
    const user = this.requireUser();
    const path = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
    this.check(await supabase.storage.from('posts').upload(path, file, { contentType: file.type }));
    return supabase.storage.from('posts').getPublicUrl(path).data.publicUrl;
  }
  public async updateProfile(updates: Partial<UserProfile>, file?: File | null): Promise<UserProfile> {
    const user = this.requireUser();
    if (file) updates = { ...updates, avatar_url: await this.upload(file) };
    const { data, error } = await supabase.from('profiles').update({
      username: updates.username ?? user.username, display_name: updates.display_name ?? user.display_name,
      bio: updates.bio ?? user.bio, avatar_url: updates.avatar_url ?? user.avatar_url,
    }).eq('id', user.id).select().single();
    if (error) throw error;
    this.currentUser = data;
    this.profiles = this.profiles.map((p) => p.id === user.id ? data : p);
    this.posts = this.posts.map((p) => p.user_id === user.id ? { ...p, profiles: data } : p);
    this.notify(); return data;
  }
  public async toggleLike(id: string): Promise<boolean> {
    const user = this.requireUser(); const post = this.posts.find((p) => p.id === id);
    if (!post) throw new Error('Post no longer exists.');
    const liked = !post.liked;
    this.check(await (liked ? supabase.from('likes').insert({ user_id: user.id, post_id: id })
      : supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', id)));
    this.likers[id] = liked ? [...(this.likers[id] || []), user.id] : (this.likers[id] || []).filter((uid) => uid !== user.id);
    this.posts = this.posts.map((p) => p.id === id ? { ...p, liked, likes: Math.max(0, p.likes + (liked ? 1 : -1)) } : p);
    this.notify(); return liked;
  }
  public async toggleSave(id: string): Promise<boolean> {
    const user = this.requireUser(); const saved = !this.savedPostIds.has(id);
    this.check(await (saved ? supabase.from('saved_posts').insert({ user_id: user.id, post_id: id })
      : supabase.from('saved_posts').delete().eq('user_id', user.id).eq('post_id', id)));
    if (saved) this.savedPostIds.add(id); else this.savedPostIds.delete(id);
    this.posts = this.posts.map((p) => p.id === id ? { ...p, saved } : p);
    this.notify(); return saved;
  }
  public async toggleFollow(id: string): Promise<boolean> {
    const user = this.requireUser(); const following = !this.followingUserIds.has(id);
    this.check(await (following ? supabase.from('follows').insert({ follower_id: user.id, following_id: id })
      : supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', id)));
    if (following) { this.followingUserIds.add(id); this.follows.push({ follower_id: user.id, following_id: id }); }
    else { this.followingUserIds.delete(id); this.follows = this.follows.filter((row) => !(row.follower_id === user.id && row.following_id === id)); }
    this.suggestions = this.suggestions.map((p) => p.id === id ? { ...p, following } : p);
    this.notify(); return following;
  }
  public async addComment(id: string, text: string): Promise<Comment> {
    const user = this.requireUser(); const body = text.trim();
    if (!body) throw new Error('Comment cannot be empty');
    if (body.length > 180) throw new Error('Comment must be 180 characters or fewer');
    const { data, error } = await supabase.from('comments').insert({ user_id: user.id, post_id: id, body }).select('id,body,created_at,profiles(username)').single();
    if (error) throw error;
    const comment = { ...data, profiles: { username: user.username } } as Comment;
    this.comments[id] = [...(this.comments[id] || []), comment];
    this.posts = this.posts.map((p) => p.id === id ? { ...p, comments: p.comments + 1 } : p);
    this.notify(); return comment;
  }
  public async deleteComment(id: string, commentId: number | string) {
    const user = this.requireUser();
    this.check(await supabase.from('comments').delete().eq('id', commentId).eq('user_id', user.id));
    this.comments[id] = (this.comments[id] || []).filter((comment) => comment.id !== commentId);
    this.posts = this.posts.map((p) => p.id === id ? { ...p, comments: (this.comments[id] || []).length } : p); this.notify();
  }
  public async createPost(params: { file?: File | null; imageUrl?: string; caption: string; location?: string; filterCss?: string }): Promise<FeedPost> {
    const user = this.requireUser();
    const image_url = params.file ? await this.upload(params.file) : params.imageUrl;
    if (!image_url || !/^https?:\/\//.test(image_url)) throw new Error('Please choose an image for your post.');
    const { data, error } = await supabase.from('posts').insert({ user_id: user.id, image_url, caption: params.caption.trim(), location: params.location?.trim() || null }).select().single();
    if (error) throw error;
    const post = { ...data, profiles: user, likes: 0, comments: 0, liked: false, saved: false } as FeedPost;
    this.posts = [post, ...this.posts]; this.notify(); return post;
  }
  public async deletePost(id: string) {
    const user = this.requireUser(); this.check(await supabase.from('posts').delete().eq('id', id).eq('user_id', user.id));
    this.posts = this.posts.filter((p) => p.id !== id); this.savedPostIds.delete(id); delete this.comments[id]; this.notify();
  }
  public addStory(_params: { imageUrl: string; caption?: string }): Story { throw new Error('Story publishing is not available.'); }
  public markStorySeen(_id: string) {}
  public markAllNotificationsRead() {}
}
export const store = new MikestaStore();

import { beforeEach, expect, it, vi } from 'vitest';
import { MikestaStore } from '../lib/store';
import { CURRENT_DEMO_USER, SEED_POSTS } from './fixtures';
const mocks = vi.hoisted(() => ({ from: vi.fn(), getSession: vi.fn(), getUser: vi.fn(), signOut: vi.fn(), updateUser: vi.fn(), onAuthStateChange: vi.fn(), upload: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { from: mocks.from, auth: mocks, storage: { from: () => ({ upload: mocks.upload, getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/upload.jpg' } }) }) } } }));
let writeError: any;
let readError: any;
let rows: Record<string, any[]>;
let state: MikestaStore;
let eventCallback: (event: string) => void;
function query(table: string) {
  let action = ''; let payload: any;
  const builder: any = {};
  for (const method of ['select', 'eq', 'order', 'delete', 'insert', 'update']) builder[method] = (...args: any[]) => {
    if (['delete', 'insert', 'update'].includes(method)) { action = method; payload = args[0]; }
    return builder;
  };
  const result = () => ({ error: action ? writeError : readError, data: action ? { id: 99, created_at: new Date().toISOString(), ...payload } : rows[table] || [] });
  builder.single = async () => result();
  builder.then = (resolve: any, reject: any) => Promise.resolve(result()).then(resolve, reject);
  return builder;
}
beforeEach(() => {
  window.history.replaceState({}, '', '/');
  vi.clearAllMocks(); localStorage.clear(); writeError = null; readError = null;
  rows = { profiles: [{ ...CURRENT_DEMO_USER }], posts: structuredClone(SEED_POSTS), likes: [], comments: [], saved_posts: [], follows: [] };
  mocks.getSession.mockResolvedValue({ data: { session: { user: CURRENT_DEMO_USER } }, error: null });
  mocks.getUser.mockResolvedValue({ data: { user: CURRENT_DEMO_USER }, error: null });
  mocks.signOut.mockResolvedValue({ error: null }); mocks.upload.mockResolvedValue({ error: null });
  mocks.updateUser.mockResolvedValue({ error: null });
  mocks.from.mockImplementation(query);
  mocks.onAuthStateChange.mockImplementation((callback) => { eventCallback = callback; return { data: { subscription: { unsubscribe: vi.fn() } } }; });
  state = new MikestaStore();
});
it('requires a validated recovery session and waits for a successful password update', async () => {
  await expect(state.resetPassword('new-password')).rejects.toThrow('valid password reset link');
  window.history.replaceState({}, '', '/reset-password'); state = new MikestaStore();
  await state.syncWithSupabase();
  expect(state.getAuthStatus()).toBe('passwordRecovery');
  expect(mocks.from).not.toHaveBeenCalled();
  mocks.updateUser.mockResolvedValueOnce({ error: { message: 'Password rejected' } });
  await expect(state.resetPassword('new-password')).rejects.toEqual({ message: 'Password rejected' });
  expect(state.getAuthStatus()).toBe('passwordRecovery');
  await state.resetPassword('new-password');
  expect(mocks.updateUser).toHaveBeenCalledWith({ password: 'new-password' });
  expect(state.getAuthStatus()).toBe('signedIn'); expect(window.location.pathname).toBe('/');
});
it('does not offer password updates for an unauthenticated reset URL', async () => {
  window.history.replaceState({}, '', '/reset-password'); state = new MikestaStore();
  mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
  await state.syncWithSupabase();
  expect(state.getAuthStatus()).toBe('error');
  await expect(state.resetPassword('new-password')).rejects.toThrow('valid password reset link');
  expect(mocks.updateUser).not.toHaveBeenCalled();
});
it('recognizes a recovery callback even when Supabase redirects to the root URL', async () => {
  const stop = state.startAuth();
  eventCallback('PASSWORD_RECOVERY');
  await state.syncWithSupabase();
  expect(state.getAuthStatus()).toBe('passwordRecovery');
  expect(state.getPosts()).toEqual([]);
  stop();
});
it('shows an expired confirmation redirect instead of silently returning to sign in', async () => {
  window.history.replaceState({}, '', '/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid');
  mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
  await state.syncWithSupabase();
  expect(state.getAuthStatus()).toBe('error');
  expect(state.getSyncError()).toContain('already used');
  expect(state.getCurrentUser()).toBeNull();
  expect(window.location.hash).toBe('');
  await state.syncWithSupabase();
  expect(state.getAuthStatus()).toBe('signedOut');
  expect(state.getSyncError()).toBe('');
});
it('ignores old cached demo identities and posts when signed out', async () => {
  localStorage.setItem('mikesta_current_user_v2', JSON.stringify(CURRENT_DEMO_USER));
  localStorage.setItem('mikesta_posts_v2', JSON.stringify(SEED_POSTS));
  mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
  state = new MikestaStore(); await state.syncWithSupabase();
  expect(state.getAuthStatus()).toBe('signedOut'); expect(state.getCurrentUser()).toBeNull(); expect(state.getPosts()).toEqual([]);
  expect(mocks.from).not.toHaveBeenCalled();
});
it('hydrates real account interactions and comments from Supabase', async () => {
  const id = SEED_POSTS[0].id;
  rows.likes = [{ post_id: id, user_id: CURRENT_DEMO_USER.id }]; rows.saved_posts = [{ post_id: id }];
  rows.comments = [{ id: 41, post_id: id, body: 'Persisted', created_at: 'now', profiles: { username: CURRENT_DEMO_USER.username } }];
  await state.syncWithSupabase();
  expect(state.getAuthStatus()).toBe('signedIn'); expect(state.getPosts()[0]).toMatchObject({ liked: true, saved: true, likes: 1, comments: 1 });
  expect(state.getComments(id)[0].id).toBe(41); expect(state.getStories()).toEqual([]);
});
it('accepts an empty remote feed instead of resurrecting local fixtures', async () => {
  await state.syncWithSupabase(); rows.posts = []; await state.syncWithSupabase(); expect(state.getPosts()).toEqual([]);
});
it('clears account data and reports a failed remote read', async () => {
  await state.syncWithSupabase(); readError = { message: 'Access denied' }; await state.syncWithSupabase();
  expect(state.getAuthStatus()).toBe('error'); expect(state.getSyncError()).toBe('Access denied'); expect(state.getPosts()).toEqual([]);
});
it('failed mutations leave likes, saves, and follows unchanged', async () => {
  await state.syncWithSupabase(); writeError = { message: 'Write denied' };
  await expect(state.toggleLike(SEED_POSTS[0].id)).rejects.toEqual(writeError);
  await expect(state.toggleSave(SEED_POSTS[0].id)).rejects.toEqual(writeError);
  await expect(state.toggleFollow('creator')).rejects.toEqual(writeError);
  expect(state.getPosts()[0].liked).toBe(false); expect(state.getSavedPosts()).toEqual([]); expect(state.isFollowing('creator')).toBe(false);
});
it('uses the database comment id and rejects invalid comments before writing', async () => {
  await state.syncWithSupabase(); const comment = await state.addComment(SEED_POSTS[0].id, 'Hello');
  expect(comment.id).toBe(99);
  mocks.from.mockClear(); await expect(state.addComment(SEED_POSTS[0].id, ' ')).rejects.toThrow('empty');
  await expect(state.addComment(SEED_POSTS[0].id, 'x'.repeat(181))).rejects.toThrow('180'); expect(mocks.from).not.toHaveBeenCalled();
});
it('does not publish locally if the image upload or database insert fails', async () => {
  await state.syncWithSupabase(); const before = state.getPosts().length;
  mocks.upload.mockResolvedValue({ error: { message: 'Storage unavailable' } });
  await expect(state.createPost({ file: new File(['photo'], 'photo.jpg'), caption: 'Photo' })).rejects.toEqual({ message: 'Storage unavailable' });
  writeError = { message: 'Insert failed' };
  await expect(state.createPost({ imageUrl: 'https://example.com/photo.jpg', caption: 'Photo' })).rejects.toEqual(writeError);
  expect(state.getPosts()).toHaveLength(before);
});
it('signout clears account state and prevents unauthenticated writes', async () => {
  await state.syncWithSupabase(); await state.signOut();
  expect(state.getPosts()).toEqual([]); expect(state.getCurrentUser()).toBeNull();
  await expect(state.toggleSave('post')).rejects.toThrow('sign in');
});
it('a late sync cannot restore account data after a signout event', async () => {
  const stop = state.startAuth();
  let resolve: any; mocks.getSession.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
  const pending = state.syncWithSupabase(); eventCallback('SIGNED_OUT');
  resolve({ data: { session: { user: CURRENT_DEMO_USER } }, error: null }); await pending;
  expect(state.getAuthStatus()).toBe('signedOut'); expect(state.getPosts()).toEqual([]); stop();
});

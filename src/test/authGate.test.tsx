import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../App';
import { AuthDialog } from '../components/AuthDialog';
const controls = vi.hoisted(() => ({ status: 'signedOut', error: '', signUp: vi.fn(), signInWithPassword: vi.fn(), resend: vi.fn(), sync: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { auth: controls } }));
vi.mock('../lib/store', () => ({
  errorMessage: (error: any) => error.message,
  store: {
    subscribe: () => () => {}, startAuth: () => () => {}, getAuthStatus: () => controls.status,
    getSyncError: () => controls.error, syncWithSupabase: controls.sync,
    getCurrentUser: () => null, getFilteredPosts: () => [], getSavedPosts: () => [], getStories: () => [],
    getNotifications: () => [], getSuggestions: () => [], getUnreadNotificationCount: () => 0,
    getIsOnline: () => true, getUserPosts: () => [], getPosts: () => [], getProfileByUsername: () => null,
    getPostsByUsername: () => [],
  },
}));
beforeEach(() => { controls.status = 'signedOut'; controls.error = ''; vi.clearAllMocks(); window.history.replaceState({}, '', '/'); });
afterEach(cleanup);
it('requires sign in at the base URL and cannot be dismissed with Escape', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Sign in to Mikesta' })).toBeInTheDocument();
  expect(screen.queryByText('Your circle,')).not.toBeInTheDocument();
  expect(screen.queryByText(/Demo/)).not.toBeInTheDocument();
  fireEvent.keyDown(document.body, { key: 'Escape' });
  expect(screen.getByRole('button', { name: /^Sign in$/ })).toBeInTheDocument();
});
it('guards direct profile URLs and waits for session validation', () => {
  window.history.replaceState({}, '', '/profile/someone'); controls.status = 'loading'; render(<App />);
  expect(screen.getByRole('status')).toHaveTextContent('Connecting');
  expect(screen.queryByRole('button', { name: 'Create a post' })).not.toBeInTheDocument();
});
it('keeps an unconfirmed sign-in at the auth screen with an error', async () => {
  controls.signInWithPassword.mockResolvedValue({ error: { message: 'Email not confirmed' } });
  const onSuccess = vi.fn(); const onClose = vi.fn();
  const { container } = render(<AuthDialog embedded mode="signin" setMode={vi.fn()} onSuccess={onSuccess} onClose={onClose} onAnnounce={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'example-password' } });
  fireEvent.submit(container.querySelector('form')!);
  expect(await screen.findByRole('alert')).toHaveTextContent('Email not confirmed');
  expect(onSuccess).not.toHaveBeenCalled(); expect(onClose).not.toHaveBeenCalled();
});
it('signup requiring confirmation does not open the feed', async () => {
  controls.signUp.mockResolvedValue({ data: { session: null }, error: null });
  const onSuccess = vi.fn(); const setMode = vi.fn();
  const { container } = render(<AuthDialog embedded mode="signup" setMode={setMode} onSuccess={onSuccess} onClose={vi.fn()} onAnnounce={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'example-password' } });
  fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'new_user' } });
  fireEvent.submit(container.querySelector('form')!);
  expect(await screen.findByRole('status')).toHaveTextContent('Check your email');
  expect(onSuccess).not.toHaveBeenCalled(); expect(setMode).toHaveBeenCalledWith('signin');
  expect(controls.signUp).toHaveBeenCalledWith(expect.objectContaining({ options: { data: { username: 'new_user' }, emailRedirectTo: `${window.location.origin}/` } }));
});
it('resends confirmation to the entered email with the current app return URL', async () => {
  controls.resend.mockResolvedValue({ error: null });
  render(<AuthDialog embedded mode="signin" setMode={vi.fn()} onSuccess={vi.fn()} onClose={vi.fn()} onAnnounce={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'Resend confirmation email' }));
  expect(await screen.findByRole('status')).toHaveTextContent('newest email');
  expect(controls.resend).toHaveBeenCalledWith({ type: 'signup', email: 'new@example.com', options: { emailRedirectTo: `${window.location.origin}/` } });
});

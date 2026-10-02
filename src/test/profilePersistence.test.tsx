import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthDialog } from '../components/AuthDialog';
import { EditProfileDialog } from '../components/EditProfileDialog';
import { MikestaStore, store } from '../lib/store';
import { CURRENT_DEMO_USER } from '../lib/mockData';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({ supabase: { from: vi.fn(), auth: { signUp: vi.fn(), signInWithPassword: vi.fn() }, storage: { from: vi.fn() } } }));
beforeEach(() => {
  localStorage.clear();
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:avatar');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.clearAllMocks(); });

function upload(container: HTMLElement) {
  const file = new File(['image'], 'avatar.png', { type: 'image/png' });
  fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  return file;
}

it('saves the selected preset after an upload and releases the old preview', async () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const { container } = render(<EditProfileDialog profile={CURRENT_DEMO_USER} onSave={onSave} onClose={vi.fn()} />);
  upload(container);
  const preset = screen.getByAltText('Preset 1');
  fireEvent.click(preset);
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ avatar_url: preset.getAttribute('src') }), null));
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:avatar');
});

it('saves a manually entered URL after an upload instead of the stale file', async () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const { container } = render(<EditProfileDialog profile={CURRENT_DEMO_USER} onSave={onSave} onClose={vi.fn()} />);
  upload(container);
  fireEvent.change(screen.getByLabelText('Avatar image URL'), { target: { value: 'https://example.com/avatar.jpg' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ avatar_url: 'https://example.com/avatar.jpg' }), null));
});

it('shows upload failure, keeps the editor open, and permits retry', async () => {
  const onSave = vi.fn().mockRejectedValueOnce(new Error('Storage unavailable')).mockResolvedValueOnce(undefined);
  const onClose = vi.fn();
  const { container } = render(<EditProfileDialog profile={CURRENT_DEMO_USER} onSave={onSave} onClose={onClose} />);
  const file = upload(container);
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Storage unavailable');
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  expect(onSave.mock.calls[1][1]).toBe(file);
});

it('rejects database save failures without replacing or persisting the local profile', async () => {
  const store = new MikestaStore();
  store.switchUser({ ...CURRENT_DEMO_USER }, true);
  const original = store.getCurrentUser();
  const beforeStorage = localStorage.getItem('mikesta_current_user_v2');
  const error = { message: 'Username already exists', code: '23505' };
  const eq = vi.fn().mockResolvedValue({ error });
  vi.mocked(supabase.from).mockReturnValue({ update: vi.fn().mockReturnValue({ eq }) } as any);
  await expect(store.updateProfile({ username: 'taken' })).rejects.toEqual(error);
  expect(store.getCurrentUser()).toEqual(original);
  expect(localStorage.getItem('mikesta_current_user_v2')).toBe(beforeStorage);
});


it('keeps a collision-safe profile provisioned by the signup trigger', async () => {
  const profile = { ...CURRENT_DEMO_USER, username: 'alex_unique' };
  vi.mocked(supabase.auth.signUp).mockResolvedValue({ data: { session: {}, user: { id: profile.id } }, error: null } as any);
  const upsert = vi.fn();
  const maybeSingle = vi.fn().mockResolvedValue({ data: profile, error: null });
  vi.mocked(supabase.from).mockReturnValue({
    select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }), upsert,
  } as any);
  const switchUser = vi.spyOn(store, 'switchUser');
  const onSuccess = vi.fn();
  const { container } = render(<AuthDialog mode="signup" setMode={vi.fn()} onSuccess={onSuccess} onClose={vi.fn()} onAnnounce={vi.fn()} />);
  fireEvent.change(container.querySelector('input[name="email"]')!, { target: { value: 'alex@example.com' } });
  fireEvent.change(container.querySelector('input[name="password"]')!, { target: { value: 'example-test-password' } });
  fireEvent.change(container.querySelector('input[name="username"]')!, { target: { value: 'alex' } });
  fireEvent.submit(container.querySelector('form')!);
  await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(profile));
  expect(switchUser).toHaveBeenCalledWith(profile, true);
  expect(upsert).not.toHaveBeenCalled();
});

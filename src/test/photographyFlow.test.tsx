import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { UploadDialog } from '../components/UploadDialog';
import { ShareDialog } from '../components/ShareDialog';
import { developPhoto, createPostcard, downloadPostcard } from '../lib/photoStudio';
vi.mock('../lib/photoStudio', async (importOriginal) => ({ ...await importOriginal<typeof import('../lib/photoStudio')>(), developPhoto: vi.fn(), createPostcard: vi.fn(), downloadPostcard: vi.fn() }));
beforeEach(() => { vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:postcard'); vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.restoreAllMocks(); });

it('publishes sample-photo adjustments as a developed file, not a discarded CSS filter', async () => {
  const onPublish = vi.fn().mockResolvedValue(undefined);
  const developed = new File(['edited'], 'developed.jpg', { type: 'image/jpeg' });
  vi.mocked(developPhoto).mockResolvedValue(developed);
  render(<UploadDialog onPublish={onPublish} onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Coastal' }));
  fireEvent.change(screen.getByRole('slider', { name: /Exposure/ }), { target: { value: '25' } });
  fireEvent.click(screen.getByRole('button', { name: /Share moment/ }));
  await waitFor(() => expect(onPublish).toHaveBeenCalledWith(expect.objectContaining({ file: developed, imageUrl: undefined, filterCss: 'none' })));
});

it('keeps the editor open without publishing if developing fails', async () => {
  vi.mocked(developPhoto).mockRejectedValue(new Error('Photo host blocked editing'));
  const onPublish = vi.fn(); const onClose = vi.fn();
  render(<UploadDialog onPublish={onPublish} onClose={onClose} />);
  fireEvent.click(screen.getByRole('button', { name: 'Coastal' }));
  fireEvent.click(screen.getByRole('button', { name: 'Drama' }));
  fireEvent.click(screen.getByRole('button', { name: /Share moment/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Photo host blocked editing');
  expect(onPublish).not.toHaveBeenCalled(); expect(onClose).not.toHaveBeenCalled();
});

it('shows export errors and lets the user retry', async () => {
  const post = { id: 'p1', image_url: 'photo', caption: 'Light', profiles: { username: 'elena' } } as any;
  vi.mocked(createPostcard).mockRejectedValueOnce(new Error('Image unavailable')).mockResolvedValueOnce(new Blob(['png']));
  render(<ShareDialog post={post} onClose={vi.fn()} onCopyLink={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Download postcard' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Image unavailable');
  fireEvent.click(screen.getByRole('button', { name: 'Download postcard' }));
  await waitFor(() => expect(downloadPostcard).toHaveBeenCalledWith(expect.any(Blob), 'p1'));
});

it('rejects oversized uploads before creating a preview URL', () => {
  const { container } = render(<UploadDialog onPublish={vi.fn()} onClose={vi.fn()} />);
  const oversized = new File(['image'], 'large.jpg', { type: 'image/jpeg' });
  Object.defineProperty(oversized, 'size', { value: 11 * 1024 * 1024 });
  fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [oversized] } });
  expect(screen.getByRole('alert')).toHaveTextContent('smaller than 10MB');
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});

it('releases an uploaded preview URL when replacing it with a sample', () => {
  const { container } = render(<UploadDialog onPublish={vi.fn()} onClose={vi.fn()} />);
  fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [new File(['image'], 'photo.jpg', { type: 'image/jpeg' })] } });
  fireEvent.click(screen.getByRole('button', { name: 'Coastal' }));
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:postcard');
});

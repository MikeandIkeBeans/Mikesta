import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPostcard, developPhoto, photoFilter, DEFAULT_ADJUSTMENTS } from '../lib/photoStudio';

let imageFails = false;
const ctx = { filter: 'none', fillStyle: '', strokeStyle: '', lineWidth: 0, font: '', textAlign: '',
  fillRect: vi.fn(), strokeRect: vi.fn(), drawImage: vi.fn(), fillText: vi.fn(),
  measureText: (text: string) => ({ width: text.length * 25 }) };
let canvas: HTMLCanvasElement;

beforeEach(() => {
  imageFails = false;
  vi.stubGlobal('Image', class {
    naturalWidth = 4000;
    naturalHeight = 2000;
    onload: () => void;
    onerror: () => void;
    set src(_value: string) { queueMicrotask(() => imageFails ? this.onerror() : this.onload()); }
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function () { canvas = this; return ctx as any; });
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback, type) => callback(new Blob(['pixels'], { type })));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

it('keeps neutral edits neutral and composes a preset with exposure', () => {
  expect(photoFilter('none', DEFAULT_ADJUSTMENTS)).toBe('none');
  expect(photoFilter('grayscale(1)', { ...DEFAULT_ADJUSTMENTS, exposure: 50 })).toContain('grayscale(1) brightness(2)');
});

it('bakes the recipe into a bounded JPEG without changing aspect ratio', async () => {
  const file = await developPhoto('blob:uploaded-photo', 'brightness(2)');
  expect(canvas.width).toBe(1440);
  expect(canvas.height).toBe(720);
  expect(ctx.filter).toBe('brightness(2)');
  expect(file.type).toBe('image/jpeg');
  expect(ctx.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1440, 720);
});

it('exports a PNG containing real post metadata and an uncropped photo', async () => {
  const blob = await createPostcard({ image_url: 'https://example.com/photo', caption: 'Coastal light', location: 'Mendocino', profiles: { username: 'elena' } });
  expect(blob.type).toBe('image/png');
  expect([canvas.width, canvas.height]).toEqual([1200, 1500]);
  expect(ctx.drawImage).toHaveBeenCalledWith(expect.anything(), 80, 320, 1040, 520);
  expect(ctx.fillText).toHaveBeenCalledWith('Coastal light', 600, 1160);
  expect(ctx.fillText).toHaveBeenCalledWith('Mendocino', 600, 1240, 1000);
});

it('bounds long unbroken captions to the print area', async () => {
  await createPostcard({ image_url: 'photo', caption: 'x'.repeat(500) });
  const title = ctx.fillText.mock.calls[0][0];
  expect(title).toMatch(/…$/);
  expect(ctx.measureText(title).width).toBeLessThanOrEqual(1000);
});

it('rejects inaccessible images and blocked canvas exports', async () => {
  imageFails = true;
  await expect(developPhoto('bad', 'brightness(2)')).rejects.toThrow('Could not load');
  imageFails = false;
  vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation(() => { throw new DOMException('Tainted', 'SecurityError'); });
  await expect(createPostcard({ image_url: 'blocked' })).rejects.toThrow('prevents image export');
});

export const DEFAULT_ADJUSTMENTS = { exposure: 0, contrast: 0, warmth: 0, saturation: 0 };
export type PhotoAdjustments = typeof DEFAULT_ADJUSTMENTS;

/** One filter recipe drives both the preview and the pixels saved at publication. */
export function photoFilter(preset: string, values: PhotoAdjustments): string {
  if (Object.values(values).every((value) => value === 0)) return preset;
  const base = preset === 'none' ? '' : preset;
  // Warmth is an aesthetic approximation, not a calibrated white-balance adjustment.
  const warmth = values.warmth > 0
    ? `sepia(${values.warmth / 100}) hue-rotate(-${values.warmth * 0.2}deg)`
    : values.warmth < 0 ? `hue-rotate(${Math.abs(values.warmth) * 0.4}deg)` : '';
  return `${base} brightness(${2 ** (values.exposure / 50)}) contrast(${1 + values.contrast / 100}) saturate(${1 + values.saturation / 100}) ${warmth}`.trim();
}

function loadPhoto(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    const timeout = window.setTimeout(() => {
      image.src = '';
      reject(new Error('Photo loading timed out. Check your connection and try again.'));
    }, 15000);
    image.onload = () => { window.clearTimeout(timeout); resolve(image); };
    image.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error('Could not load this photo. Try an uploaded image or another sample.'));
    };
    image.src = source;
  });
}

function canvasContext(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Your browser cannot render images.');
  return { canvas, context };
}

function encode(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not encode the image.')), type, quality);
    } catch {
      reject(new Error('This photo host prevents image export. Try a photo you uploaded.'));
    }
  });
}

/** Bake edits into a bounded JPEG so uploaded and sample photos use the same storage path. */
export async function developPhoto(source: string, filter: string): Promise<File> {
  const image = await loadPhoto(source);
  const scale = Math.min(1, 1440 / image.naturalWidth, 1440 / image.naturalHeight);
  const { canvas, context } = canvasContext(Math.max(1, Math.round(image.naturalWidth * scale)), Math.max(1, Math.round(image.naturalHeight * scale)));
  if (!('filter' in context)) throw new Error('Photo editing is unavailable in this browser. Reset edits to share the original.');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.filter = filter;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return new File([await encode(canvas, 'image/jpeg', 0.88)], 'mikesta-developed.jpg', { type: 'image/jpeg' });
}

export interface PostcardPhoto { image_url: string; caption?: string | null; location?: string | null; profiles?: { username: string } | null }

/** Real post data only; preserve the whole photo instead of imposing a destructive crop. */
export async function createPostcard(post: PostcardPhoto): Promise<Blob> {
  const image = await loadPhoto(post.image_url);
  const { canvas, context: ctx } = canvasContext(1200, 1500);
  ctx.fillStyle = '#faf8f5';
  ctx.fillRect(0, 0, 1200, 1500);
  ctx.strokeStyle = '#e6e2d8';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, 1120, 1420);
  const scale = Math.min(1040 / image.naturalWidth, 1000 / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  ctx.drawImage(image, (1200 - width) / 2, 80 + (1000 - height) / 2, width, height);
  ctx.fillStyle = '#1a2422';
  ctx.font = 'italic 42px Georgia, serif';
  ctx.textAlign = 'center';
  // Bound title length by measured width, including captions without spaces.
  const title = post.caption?.trim() || 'A moment worth keeping';
  let end = title.length;
  while (end > 0 && ctx.measureText(title.slice(0, end) + (end < title.length ? '…' : '')).width > 1000) end--;
  ctx.fillText(title.slice(0, end) + (end < title.length ? '…' : ''), 600, 1160);
  ctx.fillStyle = '#68736e';
  ctx.font = '24px monospace';
  ctx.fillText(post.location || 'MIKESTA PHOTO ARCHIVE', 600, 1240, 1000);
  ctx.font = '20px monospace';
  ctx.fillText(`@${post.profiles?.username || 'creator'} · MIKESTA`, 600, 1360, 1000);
  return encode(canvas, 'image/png');
}

export function downloadPostcard(blob: Blob, id: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mikesta-postcard-${id.replace(/[^a-zA-Z0-9_-]/g, '')}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser time to consume the URL before releasing its memory.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

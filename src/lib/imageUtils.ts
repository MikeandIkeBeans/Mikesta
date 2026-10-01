/**
 * Client-side image compression and resizing utility.
 * Compresses oversized user images to prevent localStorage QuotaExceededError
 * and optimize network transfer.
 */
export async function compressImage(
  file: File,
  maxWidth = 1440,
  maxHeight = 1440,
  quality = 0.84,
  filterCss?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            maxHeight = height;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to raw data url if 2D context unavailable
          resolve(e.target?.result as string);
          return;
        }

        // Apply filter preset if specified
        if (filterCss && filterCss !== 'none') {
          ctx.filter = filterCss;
        }

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized JPEG data URL
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        resolve(e.target?.result as string);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

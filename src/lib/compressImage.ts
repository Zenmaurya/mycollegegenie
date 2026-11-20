/** Client-side photo shrinking so post uploads stay small (Cloudinary free quota). */

const SUPPORTED = ['image/jpeg', 'image/png', 'image/webp'];

export function isSupportedImageType(type: string): boolean {
  return SUPPORTED.includes(type);
}

export function fitWithin(w: number, h: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(w, h));
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

/** Safari can't encode WebP and silently returns a large PNG instead — re-encode those as JPEG. */
export function needsJpegFallback(blob: Blob | null): boolean {
  return !blob || blob.type !== 'image/webp';
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function compressImage(file: File, maxSide = 1280, quality = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = fitWithin(bitmap.width, bitmap.height, maxSide);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Couldn't process this photo");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let blob = await canvasToBlob(canvas, 'image/webp', quality);
  if (needsJpegFallback(blob)) blob = await canvasToBlob(canvas, 'image/jpeg', quality);
  if (!blob) throw new Error("Couldn't process this photo");
  return blob;
}

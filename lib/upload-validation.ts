// Vercel serverless functions reject request bodies above 4.5 MB, so stay under it.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

// SVG is deliberately excluded: `image/*` would let it through.
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

export type ImageValidation =
  | { ok: true; extension: string }
  | { ok: false; error: string; status: number };

export function validateImage(file: { type: string; size: number }): ImageValidation {
  const extension = ALLOWED_IMAGE_TYPES[file.type];
  if (!extension) {
    return { ok: false, error: 'Formato no soportado. Usa JPG, PNG, WebP o HEIC.', status: 415 };
  }
  if (file.size === 0) {
    return { ok: false, error: 'El archivo está vacío.', status: 400 };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'La foto pesa más de 4 MB. Intenta con una más ligera.', status: 413 };
  }
  return { ok: true, extension };
}

import { describe, expect, it } from 'vitest';
import { MAX_IMAGE_BYTES, validateImage } from './upload-validation';

describe('validateImage', () => {
  it.each([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
    ['image/heic', 'heic'],
  ])('accepts %s', (type, extension) => {
    expect(validateImage({ type, size: 1000 })).toEqual({ ok: true, extension });
  });

  it('rejects SVG even though it is image/*', () => {
    expect(validateImage({ type: 'image/svg+xml', size: 100 })).toMatchObject({ ok: false, status: 415 });
  });

  it('rejects non-images', () => {
    expect(validateImage({ type: 'application/pdf', size: 100 })).toMatchObject({ ok: false, status: 415 });
  });

  it('rejects empty files', () => {
    expect(validateImage({ type: 'image/png', size: 0 })).toMatchObject({ ok: false, status: 400 });
  });

  it('allows exactly the size limit and rejects one byte over', () => {
    expect(validateImage({ type: 'image/png', size: MAX_IMAGE_BYTES }).ok).toBe(true);
    expect(validateImage({ type: 'image/png', size: MAX_IMAGE_BYTES + 1 })).toMatchObject({
      ok: false,
      status: 413,
    });
  });
});

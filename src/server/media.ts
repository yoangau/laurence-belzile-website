/** Which keys the admin may write, and with which headers. */

const PUBLIC_KEY = /^(img\/[A-Za-z0-9._-]+\/(\d+\.webp|og\.jpg)|docs\/[A-Za-z0-9._-]+\.pdf)$/;
const ORIGINAL_KEY = /^originals\/[A-Za-z0-9._-]+\.(jpe?g|png|webp|heic|heif|tiff?)$/i;

export type MediaTarget = { bucket: 'MEDIA' | 'CONTENT'; contentType: string; cacheControl?: string };

const TYPES: Record<string, string> = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  heif: 'image/heif',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  pdf: 'application/pdf',
};

export const mediaTarget = (key: string): MediaTarget | null => {
  if (key.includes('..')) return null;
  const contentType = TYPES[key.split('.').pop()!.toLowerCase()] ?? 'application/octet-stream';
  if (PUBLIC_KEY.test(key)) {
    // Images get a new id when replaced, so they can be cached forever. Documents keep their name.
    const cacheControl = key.startsWith('img/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600';
    return { bucket: 'MEDIA', contentType, cacheControl };
  }
  if (ORIGINAL_KEY.test(key)) return { bucket: 'CONTENT', contentType };
  return null;
};

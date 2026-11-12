/**
 * Uploads the migration output to R2.
 *   local  → the Miniflare state used by `npm run dev` (no account needed)
 *   remote → the real buckets, through the Cloudflare API (CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID)
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { mapLimit } from './images';

export type Target = 'local' | 'remote';

export type Put = (
  bucket: 'MEDIA' | 'CONTENT',
  key: string,
  body: Uint8Array | string,
  contentType: string,
) => Promise<void>;

const CONTENT_TYPES: Record<string, string> = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  pdf: 'application/pdf',
  json: 'application/json',
};
export const contentTypeFor = (key: string) =>
  CONTENT_TYPES[key.split('.').pop()!.toLowerCase()] ?? 'application/octet-stream';

/** Image keys are immutable (a replaced image gets a new id); documents can be replaced in place. */
export const cacheControlFor = (key: string) =>
  key.startsWith('img/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600';

const BUCKET_NAMES = { MEDIA: 'lb-media', CONTENT: 'lb-content' } as const;

export const createPut = async (target: Target): Promise<{ put: Put; dispose: () => Promise<void> }> => {
  if (target === 'local') {
    const { getPlatformProxy } = await import('wrangler');
    type Bucket = { put: (key: string, body: Uint8Array | string, options: object) => Promise<unknown> };
    const proxy = await getPlatformProxy<{ MEDIA: Bucket; CONTENT: Bucket }>({ configPath: 'wrangler.jsonc' });
    return {
      put: async (bucket, key, body, contentType) => {
        await proxy.env[bucket].put(key, body, {
          httpMetadata: { contentType, ...(bucket === 'MEDIA' ? { cacheControl: cacheControlFor(key) } : {}) },
        });
      },
      dispose: () => proxy.dispose(),
    };
  }

  // Same API token as wrangler (Workers R2 Storage: Edit). No separate S3 keys needed.
  const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } = process.env;
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    throw new Error('Remote upload needs CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN');
  }
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/r2/buckets`;
  return {
    put: async (bucket, key, body, contentType) => {
      const url = `${endpoint}/${BUCKET_NAMES[bucket]}/objects/${key.split('/').map(encodeURIComponent).join('/')}`;
      const headers: Record<string, string> = {
        authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'content-type': contentType,
      };
      if (bucket === 'MEDIA') headers['cache-control'] = cacheControlFor(key);
      const payload = typeof body === 'string' ? body : new Uint8Array(body); // ArrayBuffer-backed copy for fetch
      for (let attempt = 1; ; attempt++) {
        const res = await fetch(url, { method: 'PUT', body: payload, headers });
        if (res.ok) return;
        if (attempt >= 4 || (res.status < 500 && res.status !== 429)) {
          throw new Error(`PUT ${key} failed: ${res.status} ${await res.text()}`);
        }
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      }
    },
    dispose: async () => {},
  };
};

const walk = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : Promise.resolve([join(dir, e.name)]))),
  );
  return nested.flat();
};

/** Uploads every file under `mediaDir` (except meta.json caches) to the media bucket. */
export const uploadMedia = async (put: Put, mediaDir: string, log: (msg: string) => void) => {
  const files = (await walk(mediaDir)).filter((f) => !f.endsWith('meta.json'));
  let done = 0;
  await mapLimit(files, 16, async (file) => {
    const key = relative(mediaDir, file).split('\\').join('/');
    await put('MEDIA', key, await readFile(file), contentTypeFor(key));
    if (++done % 250 === 0 || done === files.length) log(`  media ${done}/${files.length}`);
  });
};

/**
 * Generates the same files the admin generates in the browser on upload:
 *   img/<id>/<width>.webp, img/<id>/og.jpg, plus metadata (size, lqip, color).
 * Results are cached in `<outDir>/img/<id>/meta.json`, so re-running is cheap.
 */
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import sharp from 'sharp';
import { variantWidths } from '../../src/content/format';
import { IMAGE_WIDTHS, type Image } from '../../src/content/schema';

export type ProcessedImage = Omit<Image, 'credit'>;

type Meta = ProcessedImage & { source: { size: number; mtimeMs: number } };

export const imageIdFor = (path: string) => basename(path, extname(path));

const toHex = ({ r, g, b }: { r: number; g: number; b: number }) =>
  `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;

export const processImage = async (sourcePath: string, outDir: string): Promise<ProcessedImage> => {
  const id = imageIdFor(sourcePath);
  const dir = join(outDir, 'img', id);
  const metaPath = join(dir, 'meta.json');
  const { size, mtimeMs } = await stat(sourcePath);

  try {
    const cached = JSON.parse(await readFile(metaPath, 'utf8')) as Meta;
    if (cached.source.size === size && cached.source.mtimeMs === mtimeMs) {
      const { source: _source, ...image } = cached;
      return image;
    }
  } catch {
    // not processed yet
  }

  await mkdir(dir, { recursive: true });
  const input = await sharp(sourcePath).rotate().toBuffer(); // apply EXIF orientation once
  const { width: originalWidth = 0 } = await sharp(input).metadata();
  const widths = variantWidths(originalWidth, IMAGE_WIDTHS);

  let largest = { width: 0, height: 0 };
  for (const width of widths) {
    const info = await sharp(input)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(join(dir, `${width}.webp`));
    if (info.width >= largest.width) largest = { width: info.width, height: info.height };
  }
  await sharp(input)
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(join(dir, 'og.jpg'));

  const lqip = await sharp(input).resize({ width: 24 }).webp({ quality: 40 }).toBuffer();
  const { dominant } = await sharp(input).stats();

  const image: ProcessedImage = {
    id,
    width: largest.width,
    height: largest.height,
    widths,
    lqip: `data:image/webp;base64,${lqip.toString('base64')}`,
    color: toHex(dominant),
  };
  await writeFile(metaPath, JSON.stringify({ ...image, source: { size, mtimeMs } } satisfies Meta));
  return image;
};

/** Runs `fn` over `items` with at most `limit` in flight. */
export const mapLimit = async <T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>) => {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]!, i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
};

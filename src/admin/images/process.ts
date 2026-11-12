/**
 * Turns a dropped photo into the files the site serves. Mirrors scripts/migrate/images.ts (sharp):
 *   <width>.webp for each of variantWidths() at quality 82, og.jpg inside 1200×1200 at quality 80,
 *   a 24px-wide WebP placeholder (quality 40) and the dominant color.
 * Runs in a Web Worker (see worker.ts), but only uses APIs that also exist on the main thread.
 */
import encodeWebp from '@jsquash/webp/encode';
import { OG_MAX, variantWidths } from '../../content/format';
import { IMAGE_WIDTHS } from '../../content/schema';

export type ProcessedImage = {
  /** Size of the largest variant. */
  width: number;
  height: number;
  widths: number[];
  variants: { width: number; blob: Blob }[];
  og: Blob;
  lqip: string;
  color: string;
};

/** An error whose message is meant for Laurence. */
export class ImageError extends Error {}

const decode = async (file: Blob): Promise<ImageBitmap> => {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // Some browsers reject the options object; they apply the EXIF orientation by default.
    try {
      return await createImageBitmap(file);
    } catch {
      throw new ImageError(
        'Ce fichier ne peut pas être lu par le navigateur (format HEIC ou fichier endommagé ?). ' +
          'Exportez la photo en JPEG (dans Photos : Fichier › Exporter) puis glissez ce fichier.',
      );
    }
  }
};

type Source = ImageBitmap | OffscreenCanvas;

const draw = (source: Source, width: number, height: number, background?: string): OffscreenCanvas => {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageError('Votre navigateur ne permet pas de traiter les images. Mettez-le à jour.');
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
};

/** Downscales in steps of at most 2×, which looks much better than one big jump. */
const resize = (source: Source, width: number, height: number, background?: string): OffscreenCanvas => {
  let current = source;
  while (current.width / 2 > width) {
    current = draw(current, Math.round(current.width / 2), Math.round(current.height / 2));
  }
  return draw(current, width, height, background);
};

const pixels = (canvas: OffscreenCanvas) => canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);

const webp = async (canvas: OffscreenCanvas, quality: number) =>
  new Blob([await encodeWebp(pixels(canvas), { quality })], { type: 'image/webp' });

const base64 = (buffer: ArrayBuffer) => {
  let binary = '';
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const hex = (values: number[]) => `#${values.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

/** Most frequent color bucket (16 levels per channel, like sharp's `dominant`), averaged. */
const dominantColor = (canvas: OffscreenCanvas): string => {
  const { data } = pixels(canvas);
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3]! < 128) continue;
    const [r, g, b] = [data[i]!, data[i + 1]!, data[i + 2]!];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    buckets.set(key, { n: bucket.n + 1, r: bucket.r + r, g: bucket.g + g, b: bucket.b + b });
  }
  const best = [...buckets.values()].sort((a, b) => b.n - a.n)[0];
  return best ? hex([best.r / best.n, best.g / best.n, best.b / best.n]) : '#ffffff';
};

const heightAt = (bitmap: Source, width: number) => Math.max(1, Math.round((bitmap.height * width) / bitmap.width));

export const processImage = async (file: Blob, onProgress: (fraction: number) => void = () => {}): Promise<ProcessedImage> => {
  const bitmap = await decode(file);
  try {
    const widths = variantWidths(bitmap.width, IMAGE_WIDTHS);
    const steps = widths.length + 2;
    let done = 0;
    const step = () => onProgress(++done / steps);

    // Largest first, each variant resized from the previous one.
    const variants: ProcessedImage['variants'] = [];
    let source: Source = bitmap;
    for (const width of [...widths].reverse()) {
      const canvas = resize(source, width, heightAt(bitmap, width));
      variants.unshift({ width, blob: await webp(canvas, 82) });
      source = canvas;
      step();
    }

    const ogScale = Math.min(1, OG_MAX / bitmap.width, OG_MAX / bitmap.height);
    const ogCanvas = resize(bitmap, Math.round(bitmap.width * ogScale), Math.round(bitmap.height * ogScale), '#ffffff');
    const og = await ogCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
    step();

    const lqip = await encodeWebp(pixels(resize(source, 24, heightAt(bitmap, 24))), { quality: 40 });
    const color = dominantColor(resize(source, 64, heightAt(bitmap, 64)));
    step();

    const largest = Math.max(...widths);
    return {
      width: largest,
      height: heightAt(bitmap, largest),
      widths,
      variants,
      og,
      lqip: `data:image/webp;base64,${base64(lqip)}`,
      color,
    };
  } finally {
    bitmap.close();
  }
};

/**
 * Processes a dropped photo (in a Web Worker) and uploads every file the site needs:
 *   img/<id>/<width>.webp, img/<id>/og.jpg, and the untouched original in originals/ (archive).
 * Resolves to the `Image` object to store in the content.
 */
import type { Image } from '../../content/schema';
import { api } from '../api';
import { ImageError } from './errors';
import type { ProcessedImage } from './process';
import type { WorkerRequest, WorkerResponse } from './worker';

const ORIGINAL_EXTENSIONS = /^(jpe?g|png|webp|heic|heif|tiff?)$/;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export const randomSuffix = (length = 6) =>
  Array.from(crypto.getRandomValues(new Uint8Array(length)), (n) => ALPHABET[n % ALPHABET.length]).join('');

let worker: Worker | null = null;
let nextJob = 0;
const jobs = new Map<
  number,
  { resolve: (r: ProcessedImage) => void; reject: (e: Error) => void; onProgress: (f: number) => void }
>();

const getWorker = (): Worker => {
  if (worker) return worker;
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') {
    throw new ImageError('Ce navigateur est trop ancien pour préparer les images. Mettez Safari ou Chrome à jour.');
  }
  worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
    const job = jobs.get(data.job);
    if (!job) return;
    if (data.type === 'progress') return job.onProgress(data.fraction);
    jobs.delete(data.job);
    if (data.type === 'done') job.resolve(data.result);
    else job.reject(data.friendly ? new ImageError(data.message) : new Error(data.message));
  };
  // The worker could not start or crashed (e.g. out of memory on a huge photo): fail the pending jobs.
  worker.onerror = (event) => {
    event.preventDefault();
    for (const job of jobs.values()) {
      job.reject(
        new Error(
          'Le traitement de l’image a échoué. Rechargez la page et réessayez, ou utilisez une photo plus petite.',
        ),
      );
    }
    jobs.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
};

const processInWorker = (file: File, onProgress: (fraction: number) => void): Promise<ProcessedImage> => {
  const w = getWorker();
  return new Promise((resolve, reject) => {
    const job = nextJob++;
    jobs.set(job, { resolve, reject, onProgress });
    w.postMessage({ job, file } satisfies WorkerRequest);
  });
};

/** One image at a time: big photos take a lot of memory while being resized. */
let queue: Promise<unknown> = Promise.resolve();
const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
};

export type UploadOptions = {
  /** Prefix of the image id, usually the work id. */
  prefix: string;
  credit?: string | undefined;
  /** 0 → 1, with a short French label of the current step. */
  onProgress?: (fraction: number, label: string) => void;
};

export const uploadImage = async (
  file: File,
  { prefix, credit, onProgress = () => {} }: UploadOptions,
): Promise<Image> => {
  onProgress(0, 'En attente…');
  const processed = await enqueue(() =>
    processInWorker(file, (fraction) => onProgress(fraction * 0.5, 'Préparation des formats…')),
  );
  const id = `${prefix}-${randomSuffix()}`;
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const uploads: [string, Blob][] = [
    ...processed.variants.map(({ width, blob }): [string, Blob] => [`img/${id}/${width}.webp`, blob]),
    [`img/${id}/og.jpg`, processed.og],
    ...(ORIGINAL_EXTENSIONS.test(extension) ? [[`originals/${id}.${extension}`, file] as [string, Blob]] : []),
  ];
  let sent = 0;
  onProgress(0.5, 'Envoi…');
  for (const [key, blob] of uploads) {
    await api.upload(key, blob);
    onProgress(0.5 + (0.5 * ++sent) / uploads.length, 'Envoi…');
  }
  return {
    id,
    width: processed.width,
    height: processed.height,
    widths: processed.widths,
    lqip: processed.lqip,
    color: processed.color,
    ...(credit ? { credit } : {}),
  };
};

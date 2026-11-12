/** Web Worker running processImage() off the main thread, so the page stays responsive. */
import { ImageError } from './errors';
import { processImage, type ProcessedImage } from './process';

export type WorkerRequest = { job: number; file: Blob };
export type WorkerResponse =
  | { job: number; type: 'progress'; fraction: number }
  | { job: number; type: 'done'; result: ProcessedImage }
  | { job: number; type: 'error'; message: string; friendly: boolean };

const scope = self as unknown as {
  postMessage: (message: WorkerResponse) => void;
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
};

scope.onmessage = async ({ data: { job, file } }) => {
  try {
    const result = await processImage(file, (fraction) => scope.postMessage({ job, type: 'progress', fraction }));
    scope.postMessage({ job, type: 'done', result });
  } catch (error) {
    scope.postMessage({
      job,
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
      friendly: error instanceof ImageError,
    });
  }
};

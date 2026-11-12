/** Typed access to the Worker bindings and secrets (see wrangler.jsonc). */
import { env as workerEnv } from 'cloudflare:workers';

export type AppEnv = Env & {
  /** Fine-grained GitHub token (Actions: write) used by "Publier". Secret. */
  GITHUB_TOKEN?: string;
  /** Comma-separated e-mails allowed in the admin (kept out of the public repo). Secret. */
  ADMIN_EMAILS?: string;
  /** `1` in .dev.vars only: skip the Access check on localhost. */
  DEV_AUTH_BYPASS?: string;
};

export const env = workerEnv as AppEnv;

export const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...init.headers },
  });

export const errorResponse = (status: number, message: string, details?: unknown) =>
  json({ error: message, ...(details === undefined ? {} : { details }) }, { status });

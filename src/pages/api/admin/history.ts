/** GET: published versions. POST { key }: restore one as the draft. */
import type { APIRoute } from 'astro';
import { env, errorResponse, json } from '../../../server/env';
import { listHistory, restoreVersion } from '../../../server/storage';

export const prerender = false;

export const GET: APIRoute = async () => json(await listHistory(env));

export const POST: APIRoute = async ({ request }) => {
  const { key } = ((await request.json().catch(() => ({}))) ?? {}) as { key?: string };
  if (!key) return errorResponse(400, 'Version manquante');
  try {
    return json(await restoreVersion(env, key));
  } catch (error) {
    return errorResponse(400, error instanceof Error ? error.message : 'Erreur');
  }
};

/** GET the draft (or published) content; PUT a new draft. */
import type { APIRoute } from 'astro';
import { env, errorResponse, json } from '../../../server/env';
import { ConflictError, getState, InvalidContentError, saveDraft } from '../../../server/storage';

export const prerender = false;

export const GET: APIRoute = async () => {
  const state = await getState(env);
  return state ? json(state) : errorResponse(404, 'Aucun contenu. Lancez la migration (npm run migrate).');
};

export const PUT: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  if (!body) return errorResponse(400, 'JSON invalide');
  try {
    return json(await saveDraft(env, body, request.headers.get('if-match')));
  } catch (error) {
    if (error instanceof ConflictError) return errorResponse(409, error.message);
    if (error instanceof InvalidContentError) return errorResponse(422, error.message, error.issues);
    throw error;
  }
};

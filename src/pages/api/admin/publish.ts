/** POST: publish the draft and start the deploy. GET: status of the last deploy. */
import type { APIRoute } from 'astro';
import { env, errorResponse, json } from '../../../server/env';
import { deployStatus, triggerDeploy } from '../../../server/github';
import { InvalidContentError, publishDraft } from '../../../server/storage';

export const prerender = false;

export const POST: APIRoute = async () => {
  try {
    const published = await publishDraft(env);
    const deploy = await triggerDeploy(env);
    return json({ ...published, deploy });
  } catch (error) {
    if (error instanceof InvalidContentError) return errorResponse(422, error.message, error.issues);
    return errorResponse(500, error instanceof Error ? error.message : 'Erreur');
  }
};

export const GET: APIRoute = async () => json(await deployStatus(env));

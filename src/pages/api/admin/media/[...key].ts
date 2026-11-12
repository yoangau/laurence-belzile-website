/**
 * PUT the raw file body to store it:
 *   img/<id>/<width>.webp, img/<id>/og.jpg, docs/<name>.pdf  → public media bucket
 *   originals/<name>                                          → private bucket (archive)
 */
import type { APIRoute } from 'astro';
import { env, errorResponse, json } from '../../../../server/env';
import { mediaTarget } from '../../../../server/media';

export const prerender = false;

export const PUT: APIRoute = async ({ params, request }) => {
  const key = params.key ?? '';
  const target = mediaTarget(key);
  if (!target) return errorResponse(400, `Nom de fichier refusé : ${key}`);
  if (!request.body) return errorResponse(400, 'Fichier vide');

  const bucket = target.bucket === 'MEDIA' ? env.MEDIA : env.CONTENT;
  const object = await bucket.put(key, request.body, {
    httpMetadata: { contentType: target.contentType, ...(target.cacheControl ? { cacheControl: target.cacheControl } : {}) },
  });
  return json({ key, size: object?.size ?? 0 });
};

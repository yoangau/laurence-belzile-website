/**
 * Serves the media bucket through the Worker. Used in local dev and on the workers.dev staging URL;
 * in production, images come straight from the R2 custom domain (media.laurencebelzile.com) instead.
 */
import type { APIRoute } from 'astro';
import { env } from '../../server/env';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const key = params.key ?? '';
  const object = await env.MEDIA.get(key, { range: request.headers, onlyIf: request.headers });
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  if (!('body' in object)) return new Response(null, { status: 304, headers });
  return new Response(object.body, { headers, status: object.range && request.headers.has('range') ? 206 : 200 });
};

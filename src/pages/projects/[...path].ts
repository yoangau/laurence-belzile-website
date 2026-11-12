/**
 * v1 image URLs (/projects/LB00001.jpg, /projects/compressed/…, /projects/placeholders/…)
 * are linked from Google Images and old shares: redirect them to the new image.
 */
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = ({ params, redirect }) => {
  const file = (params.path ?? '').split('/').pop() ?? '';
  const id = file.replace(/\.(jpe?g|png)$/i, '');
  if (!/^[A-Za-z0-9._-]+$/.test(id)) return new Response('Not found', { status: 404 });
  return redirect(`${import.meta.env.PUBLIC_MEDIA_URL}/img/${id}/og.jpg`, 301);
};

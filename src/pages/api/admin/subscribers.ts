/** GET: all newsletter subscribers. DELETE ?email=…: remove one. */
import type { APIRoute } from 'astro';
import { env, errorResponse, json } from '../../../server/env';

export const prerender = false;

export const GET: APIRoute = async () => {
  const { results } = await env.DB.prepare(
    'SELECT email, locale, created_at AS createdAt FROM subscribers ORDER BY created_at DESC',
  ).all();
  return json(results);
};

export const DELETE: APIRoute = async ({ url }) => {
  const email = url.searchParams.get('email');
  if (!email) return errorResponse(400, 'Courriel manquant');
  await env.DB.prepare('DELETE FROM subscribers WHERE email = ?').bind(email.toLowerCase()).run();
  return json({ ok: true });
};

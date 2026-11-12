import type { APIRoute } from 'astro';
import { json } from '../../../server/env';

export const prerender = false;

/** Who is logged in, plus build-time settings the admin needs. */
export const GET: APIRoute = ({ locals }) =>
  json({ email: locals.admin?.email ?? null, mediaUrl: import.meta.env.PUBLIC_MEDIA_URL });

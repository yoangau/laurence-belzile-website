/** Public: newsletter sign-up from /contact. Accepts JSON (fetch) or a regular form post (no JS). */
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { env, errorResponse, json } from '../../server/env';

export const prerender = false;

const Body = z.object({
  email: z.email().max(254),
  locale: z.enum(['fr', 'en']).default('fr'),
  /** Honeypot: hidden from people, filled by bots. */
  website: z.string().max(0).optional(),
});

export const POST: APIRoute = async ({ request, redirect }) => {
  const isJson = request.headers.get('content-type')?.includes('application/json');
  const raw = isJson ? await request.json().catch(() => null) : Object.fromEntries(await request.formData());
  const parsed = Body.safeParse(raw);
  const back = (ok: boolean) =>
    redirect(`${parsed.data?.locale === 'en' ? '/en' : ''}/contact?subscribed=${ok ? 1 : 0}`, 303);

  if (!parsed.success) return isJson ? errorResponse(400, 'Adresse courriel invalide') : back(false);

  try {
    await env.DB.prepare('INSERT OR IGNORE INTO subscribers (email, locale, created_at) VALUES (?, ?, ?)')
      .bind(parsed.data.email.toLowerCase(), parsed.data.locale, new Date().toISOString())
      .run();
  } catch (error) {
    console.error('subscribe failed', error);
    return isJson ? errorResponse(500, 'Erreur') : back(false);
  }
  return isJson ? json({ ok: true }) : back(true);
};

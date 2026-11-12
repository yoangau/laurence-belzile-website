/** Protects /admin and /api/admin/*. Public pages are static files and never reach this code. */
import { defineMiddleware } from 'astro:middleware';
import { authenticate } from './server/auth';
import { env, errorResponse } from './server/env';

const isProtected = (path: string) => path === '/admin' || path.startsWith('/admin/') || path.startsWith('/api/admin/');

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.isPrerendered || !isProtected(context.url.pathname)) return next();

  const admin = await authenticate(context.request, env);
  if (!admin) {
    return context.url.pathname.startsWith('/api/')
      ? errorResponse(401, 'Non autorisé')
      : new Response('Accès refusé. Connectez-vous avec Cloudflare Access.', { status: 401 });
  }
  context.locals.admin = admin;
  const response = await next();
  response.headers.set('cache-control', 'no-store');
  response.headers.set('x-robots-tag', 'noindex');
  return response;
});

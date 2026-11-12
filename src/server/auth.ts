/**
 * Admin authentication.
 *
 * Cloudflare Access sits in front of /admin and /api/admin and handles the login (Google or e-mail code).
 * As a second lock, the Worker verifies the signed JWT that Access adds to every request, and checks the
 * e-mail against ADMIN_EMAILS — so a misconfigured Access policy can't expose the admin.
 */
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { AppEnv } from './env';

export type Admin = { email: string };

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;
let jwksTeam: string | undefined;

const isLocalhost = (url: URL) => ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);

const readToken = (request: Request) =>
  request.headers.get('cf-access-jwt-assertion') ??
  request.headers
    .get('cookie')
    ?.split(/;\s*/)
    .find((c) => c.startsWith('CF_Authorization='))
    ?.slice('CF_Authorization='.length);

export const allowedEmails = (env: AppEnv) =>
  (env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

/** Returns the admin, or null when the request is not authenticated as an allowed admin. */
export const authenticate = async (request: Request, env: AppEnv): Promise<Admin | null> => {
  const url = new URL(request.url);
  if (env.DEV_AUTH_BYPASS === '1' && isLocalhost(url)) return { email: 'dev@localhost' };

  const token = readToken(request);
  const team = env.CF_ACCESS_TEAM_DOMAIN;
  if (!token || !team || !env.CF_ACCESS_AUD || team.startsWith('REPLACE')) return null;

  if (!jwks || jwksTeam !== team) {
    jwks = createRemoteJWKSet(new URL(`https://${team}/cdn-cgi/access/certs`));
    jwksTeam = team;
  }
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer: `https://${team}`, audience: env.CF_ACCESS_AUD });
    const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : '';
    return allowedEmails(env).includes(email) ? { email } : null;
  } catch {
    return null;
  }
};

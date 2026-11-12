/** Minimal client-side routing under /admin (the Astro page is a catch-all). */
import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react';

export const BASE = '/admin';

const subscribe = (listener: () => void) => {
  window.addEventListener('popstate', listener);
  return () => window.removeEventListener('popstate', listener);
};

/** The path below /admin, e.g. "/oeuvres/LB00654" ("/" for the home). */
export const usePath = (): string =>
  useSyncExternalStore(subscribe, () => decodeURIComponent(window.location.pathname.slice(BASE.length)) || '/');

export const navigate = (path: string, { replace = false } = {}) => {
  const url = `${BASE}${path}`;
  if (url === window.location.pathname) return;
  window.history[replace ? 'replaceState' : 'pushState'](null, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
};

/** Matches "/oeuvres/:id" against "/oeuvres/LB00654" → { id: "LB00654" }. */
export const matchPath = (pattern: string, path: string): Record<string, string> | null => {
  const want = pattern.split('/');
  const got = path.replace(/\/$/, '').split('/');
  if (want.length !== got.length) return null;
  const params: Record<string, string> = {};
  for (const [i, part] of want.entries()) {
    if (part.startsWith(':')) params[part.slice(1)] = got[i]!;
    else if (part !== got[i]) return null;
  }
  return params;
};

/** Props to make any link-like component (Mantine NavLink, Button, Anchor…) navigate in-app. */
export const linkProps = (path: string) => ({
  href: `${BASE}${path}`,
  onClick: (event: MouseEvent<HTMLElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    navigate(path);
  },
});

export const Link = ({ to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
  <a {...props} {...linkProps(to)} />
);

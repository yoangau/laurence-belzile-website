/** Queries over the published content, used by the public pages at build time. */
import content from 'virtual:lb-content';
import { publishedWorks } from '../content/format';
import type { Artwork, Exhibition, Work } from '../content/schema';

export { content };

export const MEDIA_URL = import.meta.env.PUBLIC_MEDIA_URL;

/** Every published work, newest first (the home feed and the prev/next ring). */
export const works: Work[] = publishedWorks(content);
export const artworks = works.filter((w): w is Artwork => w.kind === 'artwork');
export const exhibitions = works.filter((w): w is Exhibition => w.kind === 'exhibition');

/** Previous / next work in display order, wrapping around. */
export const neighbors = (id: string) => {
  const i = works.findIndex((w) => w.id === id);
  const at = (j: number) => works[(j + works.length) % works.length]!;
  return { previous: at(i - 1), next: at(i + 1) };
};

/** The first work of each year, which carries the year anchor (`#2024`). */
export const yearAnchors = (list: Work[]) => {
  const anchors = new Map<number, string>();
  for (const work of list) if (!anchors.has(work.year)) anchors.set(work.year, work.id);
  return anchors;
};

export const documentsFor = (placement: 'nav' | 'cv') => content.documents.filter((d) => d.placement === placement);

/** Absolute URL (social networks need one for og:image). */
export const absoluteUrl = (url: string, site: URL) => (url.startsWith('/') ? new URL(url, site).href : url);

export const personJsonLd = (site: URL) => ({
  '@type': 'Person',
  name: 'Laurence Belzile',
  url: site.origin,
  sameAs: [content.settings.instagramUrl, content.settings.facebookUrl].filter(Boolean),
});

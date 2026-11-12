import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { contentPlugin, loadContentFile } from './src/content/source';

const SITE = 'https://laurencebelzile.com';
const MEDIA_URL = process.env.PUBLIC_MEDIA_URL ?? '/media';
const content = loadContentFile();

/** Old document URLs (e.g. /catalogue2026.pdf, /resume/Belzile_CV_FR.pdf) keep working. */
const documentRedirects = Object.fromEntries(
  content.documents.flatMap((doc) =>
    doc.legacyPaths.map((path) => {
      const file = path.toLowerCase().includes('_en') ? doc.file.en : doc.file.fr;
      const destination = /^https?:/.test(file) ? file : `${MEDIA_URL}/${file}`;
      return [path, { status: 301 as const, destination }];
    }),
  ),
);

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'never',
  // /work.html is served at /work, matching the v1 URLs exactly.
  build: { format: 'file' },
  adapter: cloudflare(),
  integrations: [
    react({ include: ['src/admin/**'] }),
    sitemap({
      filter: (page) => !page.includes('/admin'),
      i18n: { defaultLocale: 'fr', locales: { fr: 'fr-CA', en: 'en-CA' } },
    }),
  ],
  redirects: documentRedirects,
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  devToolbar: { enabled: false },
  vite: {
    plugins: [contentPlugin()],
    define: { 'import.meta.env.PUBLIC_MEDIA_URL': JSON.stringify(MEDIA_URL) },
  },
});

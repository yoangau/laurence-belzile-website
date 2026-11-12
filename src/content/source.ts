/**
 * Build-time access to the published content (Node only — used by astro.config and the Vite plugin).
 *
 * Order of precedence:
 *   1. $CONTENT_FILE
 *   2. .content/published.json   (downloaded from R2 by CI, or written by `npm run migrate`)
 *   3. fixtures/content.sample.json  (small sample so a fresh clone builds)
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { ContentSchema, type Content } from './schema';

export const contentFilePath = (): string => {
  const candidates = [process.env.CONTENT_FILE, '.content/published.json', 'fixtures/content.sample.json'];
  const found = candidates.find((p): p is string => !!p && existsSync(resolve(p)));
  if (!found) throw new Error('No content file found (see src/content/source.ts)');
  return resolve(found);
};

export const loadContentFile = (): Content => {
  const path = contentFilePath();
  const result = ContentSchema.safeParse(JSON.parse(readFileSync(path, 'utf8')));
  if (!result.success) {
    throw new Error(
      `Invalid content in ${path}:\n${result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`,
    );
  }
  return result.data;
};

const VIRTUAL_ID = 'virtual:lb-content';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

/** Exposes the validated content as `import content from 'virtual:lb-content'`. */
export const contentPlugin = (): Plugin => ({
  name: 'lb-content',
  resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
  load(id) {
    if (id !== RESOLVED_ID) return undefined;
    const path = contentFilePath();
    this.addWatchFile(path);
    if (path.endsWith('content.sample.json')) {
      this.warn(
        'Using fixtures/content.sample.json — run `npm run content:pull` or `npm run migrate` for real content.',
      );
    }
    return `export default ${JSON.stringify(loadContentFile())};`;
  },
});

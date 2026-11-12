/**
 * Content storage in the private R2 bucket:
 *   draft.json                 what the admin edits
 *   published.json             what the public site is built from
 *   history/<iso date>.json    every published version (restorable)
 */
import { ContentSchema, type Content } from '../content/schema';
import type { AppEnv } from './env';

export const DRAFT_KEY = 'draft.json';
export const PUBLISHED_KEY = 'published.json';
export const HISTORY_PREFIX = 'history/';

export type ContentState = {
  content: Content;
  /** Pass back as `If-Match` when saving, to detect edits from another tab. */
  etag: string;
  publishedAt: string | null;
  hasUnpublishedChanges: boolean;
};

export class ConflictError extends Error {}
export class InvalidContentError extends Error {
  constructor(public issues: { path: string; message: string }[]) {
    super('Contenu invalide');
  }
}

export const validate = (data: unknown): Content => {
  const result = ContentSchema.safeParse(data);
  if (!result.success) {
    throw new InvalidContentError(result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })));
  }
  return result.data;
};

const readJson = async (object: R2ObjectBody) => validate(await object.json());

export const getState = async (env: AppEnv): Promise<ContentState | null> => {
  const [draft, published] = await Promise.all([env.CONTENT.get(DRAFT_KEY), env.CONTENT.head(PUBLISHED_KEY)]);
  const source = draft ?? (await env.CONTENT.get(PUBLISHED_KEY));
  if (!source) return null;
  return {
    content: await readJson(source),
    etag: source.etag,
    publishedAt: published?.uploaded.toISOString() ?? null,
    hasUnpublishedChanges: !published || (!!draft && draft.uploaded > published.uploaded),
  };
};

export const saveDraft = async (env: AppEnv, data: unknown, ifMatch: string | null): Promise<ContentState> => {
  const content = validate(data);
  content.updatedAt = new Date().toISOString();
  const body = JSON.stringify(content);
  const existing = await env.CONTENT.head(DRAFT_KEY);
  const written = await env.CONTENT.put(DRAFT_KEY, body, {
    httpMetadata: { contentType: 'application/json' },
    ...(ifMatch && existing ? { onlyIf: { etagMatches: ifMatch } } : {}),
  });
  if (!written) throw new ConflictError('Le contenu a été modifié ailleurs (autre onglet ?). Rechargez la page.');
  const published = await env.CONTENT.head(PUBLISHED_KEY);
  return { content, etag: written.etag, publishedAt: published?.uploaded.toISOString() ?? null, hasUnpublishedChanges: true };
};

/** Copies the draft to published.json and keeps a copy in history/. */
export const publishDraft = async (env: AppEnv): Promise<{ publishedAt: string; historyKey: string }> => {
  const draft = (await env.CONTENT.get(DRAFT_KEY)) ?? (await env.CONTENT.get(PUBLISHED_KEY));
  if (!draft) throw new Error('Aucun contenu à publier');
  const content = await readJson(draft);
  const publishedAt = new Date().toISOString();
  const body = JSON.stringify(content);
  const historyKey = `${HISTORY_PREFIX}${publishedAt}.json`;
  const options = { httpMetadata: { contentType: 'application/json' } };
  await env.CONTENT.put(historyKey, body, options);
  await env.CONTENT.put(PUBLISHED_KEY, body, options);
  return { publishedAt, historyKey };
};

export const listHistory = async (env: AppEnv) => {
  const keys: { key: string; publishedAt: string; size: number }[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.CONTENT.list({ prefix: HISTORY_PREFIX, ...(cursor ? { cursor } : {}) });
    for (const o of page.objects) {
      keys.push({ key: o.key, publishedAt: o.key.slice(HISTORY_PREFIX.length, -'.json'.length), size: o.size });
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return keys.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
};

/** Puts an old version back as the draft (it still has to be published). */
export const restoreVersion = async (env: AppEnv, key: string): Promise<ContentState> => {
  if (!key.startsWith(HISTORY_PREFIX) || key.includes('..')) throw new Error('Version invalide');
  const object = await env.CONTENT.get(key);
  if (!object) throw new Error('Version introuvable');
  return saveDraft(env, await object.json(), null);
};

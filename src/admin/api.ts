/** Typed client for the admin API (src/pages/api/admin). Same origin; auth is handled by the middleware. */
import type { Content } from '../content/schema';

export type Issue = { path: string; message: string };

export type ContentState = {
  content: Content;
  etag: string;
  publishedAt: string | null;
  hasUnpublishedChanges: boolean;
};

export type Me = { email: string | null; mediaUrl: string };

export type PublishResult = {
  publishedAt: string;
  historyKey: string;
  deploy: { triggered: boolean; reason?: string };
};

export type DeployStatus = {
  status: 'queued' | 'in_progress' | 'completed' | 'unknown';
  conclusion: string | null;
  startedAt: string | null;
  url: string | null;
};

export type HistoryEntry = { key: string; publishedAt: string; size: number };

export type Subscriber = { email: string; locale: string; createdAt: string };

/** An error with a message that can be shown to Laurence as is. */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details: Issue[] = [],
  ) {
    super(message);
  }
}

const friendlyStatus = (status: number) =>
  status === 401
    ? 'Votre session a expiré. Rechargez la page pour vous reconnecter.'
    : status >= 500
      ? 'Le serveur a rencontré un problème. Réessayez dans un instant.'
      : `Erreur ${status}`;

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  let res: Response;
  try {
    res = await fetch(path, { credentials: 'same-origin', ...init });
  } catch {
    throw new ApiError('Impossible de joindre le serveur. Vérifiez votre connexion internet.', 0);
  }
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const { error, details } = (body ?? {}) as { error?: string; details?: Issue[] };
    throw new ApiError(res.status >= 500 || !error ? friendlyStatus(res.status) : error, res.status, details ?? []);
  }
  return body as T;
};

const jsonInit = (method: string, data: unknown, headers: Record<string, string> = {}): RequestInit => ({
  method,
  headers: { 'content-type': 'application/json', ...headers },
  body: JSON.stringify(data),
});

export const api = {
  me: () => request<Me>('/api/admin/me'),
  getContent: () => request<ContentState>('/api/admin/content'),
  saveContent: (content: Content, etag: string) =>
    request<ContentState>('/api/admin/content', jsonInit('PUT', content, { 'if-match': etag })),
  publish: () => request<PublishResult>('/api/admin/publish', { method: 'POST' }),
  deployStatus: () => request<DeployStatus>('/api/admin/publish'),
  history: () => request<HistoryEntry[]>('/api/admin/history'),
  restore: (key: string) => request<ContentState>('/api/admin/history', jsonInit('POST', { key })),
  subscribers: () => request<Subscriber[]>('/api/admin/subscribers'),
  deleteSubscriber: (email: string) =>
    request<{ ok: true }>(`/api/admin/subscribers?email=${encodeURIComponent(email)}`, { method: 'DELETE' }),
  /** Stores a file in the media buckets. See src/server/media.ts for the allowed keys. */
  upload: (key: string, file: Blob, contentType = file.type || 'application/octet-stream') =>
    request<{ key: string; size: number }>(`/api/admin/media/${key}`, {
      method: 'PUT',
      headers: { 'content-type': contentType },
      body: file,
    }),
};

/**
 * The draft store: the content being edited, whether it differs from what was saved,
 * and the save / publish actions. A tiny external store read with `useStore(selector)`.
 * Edits go through `edit(draft => { … })` (immer), so unchanged parts keep their identity.
 */
import { notifications } from '@mantine/notifications';
import { produce, type Draft } from 'immer';
import { useSyncExternalStore } from 'react';
import type { Content } from '../content/schema';
import { api, ApiError, type ContentState } from './api';
import { fromServerIssues, validateContent, type ValidationIssue } from './validation';

export type DeployPhase =
  /** Nothing published in this session. */
  | 'idle'
  | 'publishing'
  /** The site is being rebuilt (~2 min). */
  | 'deploying'
  | 'live'
  | 'failed'
  /** Published, but the automatic deploy is not configured (local dev). */
  | 'not-triggered';

export type State = {
  status: 'loading' | 'ready' | 'error';
  loadError: string | null;
  email: string | null;
  mediaUrl: string;
  /** The draft being edited (null until loaded). */
  content: Content | null;
  /** The last saved version; `content !== saved` means unsaved changes. */
  saved: Content | null;
  etag: string;
  publishedAt: string | null;
  hasUnpublishedChanges: boolean;
  saving: boolean;
  /** The draft was saved from another tab or device: reload needed. */
  conflict: boolean;
  /** Validation problems. Once a save failed, they are recomputed after every edit. */
  issues: ValidationIssue[];
  deploy: { phase: DeployPhase; message?: string; url?: string | null };
};

let state: State = {
  status: 'loading',
  loadError: null,
  email: null,
  mediaUrl: '/media',
  content: null,
  saved: null,
  etag: '',
  publishedAt: null,
  hasUnpublishedChanges: false,
  saving: false,
  conflict: false,
  issues: [],
  deploy: { phase: 'idle' },
};

const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const setState = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};
export const getState = () => state;

/** Reads a slice of the store. The selector must return a stable value (a field, a primitive…). */
export const useStore = <T>(selector: (s: State) => T): T => useSyncExternalStore(subscribe, () => selector(state));

/** The draft. Only call below <App>, which renders pages once the content is loaded. */
export const useContent = (): Content => useStore((s) => s.content!);
export const useMediaUrl = () => useStore((s) => s.mediaUrl);
export const useDirty = () => useStore((s) => s.content !== s.saved);
/** The validation message for one field, e.g. `works.3.price`. */
export const useFieldError = (path: string) => useStore((s) => s.issues.find((i) => i.path === path)?.message);
/** Whether any field under `prefix` (e.g. `works.3.`) has a problem. */
export const useHasErrors = (prefix: string) => useStore((s) => s.issues.some((i) => i.path.startsWith(prefix)));

const applyState = (next: ContentState) =>
  setState({
    content: next.content,
    saved: next.content,
    etag: next.etag,
    publishedAt: next.publishedAt,
    hasUnpublishedChanges: next.hasUnpublishedChanges,
    issues: [],
    conflict: false,
  });

export const load = async () => {
  try {
    const [me, content] = await Promise.all([api.me(), api.getContent()]);
    setState({ email: me.email, mediaUrl: me.mediaUrl, status: 'ready' });
    applyState(content);
  } catch (error) {
    setState({ status: 'error', loadError: error instanceof Error ? error.message : String(error) });
  }
};

/** Replaces the draft with a state returned by the server (e.g. after restoring a version). */
export const replaceDraft = (next: ContentState) => applyState(next);

export const edit = (recipe: (draft: Draft<Content>) => void) => {
  if (!state.content) return;
  const content = produce(state.content, recipe);
  if (content === state.content) return;
  if (!state.issues.length) return setState({ content });
  const issues = validateContent(content);
  setState({ content, issues });
  if (!issues.length) notifications.hide('validation');
};

const showIssues = (issues: ValidationIssue[]) => {
  const shown = issues.slice(0, 4).map((i) => `${i.where} : ${i.message}`);
  if (issues.length > shown.length) shown.push(`… et ${issues.length - shown.length} autre(s)`);
  notifications.show({
    id: 'validation',
    color: 'red',
    title: 'Impossible d’enregistrer : certains champs sont à corriger',
    message: shown.join('\n'),
    autoClose: 12000,
    style: { whiteSpace: 'pre-line' },
  });
};

let saving: Promise<boolean> | null = null;

/** Saves the draft. Resolves to false (after telling her why) when it could not be saved. */
export const save = (options: { quiet?: boolean } = {}): Promise<boolean> => {
  saving ??= doSave(options).finally(() => {
    saving = null;
  });
  return saving;
};

const doSave = async ({ quiet = false }: { quiet?: boolean }): Promise<boolean> => {
  const sent = state.content;
  if (!sent) return false;
  if (sent === state.saved) return true;
  const issues = validateContent(sent);
  if (issues.length) {
    setState({ issues });
    showIssues(issues);
    return false;
  }
  setState({ saving: true });
  try {
    const result = await api.saveContent(sent, state.etag);
    // Keep our own objects (so nothing re-renders needlessly); only the timestamp changed on the server.
    const saved = produce(sent, (draft) => {
      draft.updatedAt = result.content.updatedAt;
    });
    setState({
      // If she kept typing while saving, keep those edits (still unsaved).
      content: state.content === sent ? saved : state.content,
      saved,
      etag: result.etag,
      publishedAt: result.publishedAt,
      hasUnpublishedChanges: true,
      issues: [],
      saving: false,
    });
    notifications.hide('validation');
    if (!quiet) notifications.show({ color: 'dark', message: 'Modifications enregistrées.', autoClose: 2500 });
    return true;
  } catch (error) {
    setState({ saving: false });
    if (error instanceof ApiError && error.status === 409) {
      setState({ conflict: true });
    } else if (error instanceof ApiError && error.status === 422) {
      const serverIssues = fromServerIssues(sent, error.details);
      setState({ issues: serverIssues });
      showIssues(serverIssues);
    } else {
      notifications.show({
        color: 'red',
        title: 'Enregistrement impossible',
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return false;
  }
};

const POLL_MS = 5000;
const POLL_LIMIT_MS = 15 * 60 * 1000;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Saves if needed, publishes the draft, then follows the site rebuild until it is online. */
export const publish = async () => {
  if (state.content !== state.saved && !(await save({ quiet: true }))) return;
  setState({ deploy: { phase: 'publishing' } });
  let result;
  try {
    result = await api.publish();
  } catch (error) {
    setState({ deploy: { phase: 'idle' } });
    notifications.show({
      color: 'red',
      title: 'Publication impossible',
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
  setState({ publishedAt: result.publishedAt, hasUnpublishedChanges: false });

  if (!result.deploy.triggered) {
    setState({ deploy: { phase: 'not-triggered', message: result.deploy.reason ?? '' } });
    notifications.show({
      color: 'yellow',
      title: 'Version publiée',
      message: `La version est enregistrée comme publiée, mais la mise en ligne automatique n’a pas pu démarrer. Détail : ${result.deploy.reason ?? 'inconnu'}`,
      autoClose: 10000,
    });
    return;
  }

  setState({ deploy: { phase: 'deploying' } });
  notifications.show({
    color: 'dark',
    title: 'Publication en cours',
    message: 'Le site se met à jour. Cela prend environ deux minutes.',
  });
  // Ignore the previous run, which may still be reported as the latest one for a few seconds.
  const since = Date.parse(result.publishedAt) - 60_000;
  const deadline = Date.now() + POLL_LIMIT_MS;
  while (Date.now() < deadline) {
    await wait(POLL_MS);
    const status = await api.deployStatus().catch(() => null);
    if (!status || !status.startedAt || Date.parse(status.startedAt) < since) continue;
    if (status.status !== 'completed') continue;
    if (status.conclusion === 'success') {
      setState({ deploy: { phase: 'live', url: status.url } });
      notifications.show({ color: 'green', title: 'En ligne ✓', message: 'Le site est à jour.' });
    } else {
      setState({ deploy: { phase: 'failed', url: status.url } });
      notifications.show({
        color: 'red',
        title: 'La mise en ligne a échoué',
        message: 'Votre version est publiée mais le site ne s’est pas mis à jour. Prévenez votre webmestre.',
        autoClose: false,
      });
    }
    return;
  }
  setState({ deploy: { phase: 'idle' } });
};

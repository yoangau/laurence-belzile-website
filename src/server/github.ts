/**
 * "Publier" triggers the deploy workflow (.github/workflows/deploy.yml), which downloads
 * published.json from R2, builds the static site and deploys it. Takes ~2 minutes.
 */
import type { AppEnv } from './env';

const WORKFLOW = 'deploy.yml';

const headers = (token: string) => ({
  accept: 'application/vnd.github+json',
  authorization: `Bearer ${token}`,
  'user-agent': 'laurence-belzile-admin',
  'x-github-api-version': '2022-11-28',
});

type Run = { id: number; status: string; conclusion: string | null; run_started_at: string; html_url: string };

const api = (env: AppEnv, path: string, init: RequestInit = {}) =>
  fetch(`https://api.github.com/repos/${env.GITHUB_REPO}${path}`, { ...init, headers: headers(env.GITHUB_TOKEN!) });

const latestRun = async (env: AppEnv): Promise<Run | null> => {
  const branch = encodeURIComponent(env.DEPLOY_BRANCH);
  const res = await api(env, `/actions/workflows/${WORKFLOW}/runs?branch=${branch}&per_page=1`);
  if (!res.ok) return null;
  const { workflow_runs: runs } = (await res.json()) as { workflow_runs: Run[] };
  return runs[0] ?? null;
};

export const triggerDeploy = async (env: AppEnv): Promise<{ triggered: boolean; reason?: string }> => {
  if (!env.GITHUB_TOKEN)
    return { triggered: false, reason: 'GITHUB_TOKEN non configuré (publication locale seulement)' };

  const dispatch = await api(env, `/actions/workflows/${WORKFLOW}/dispatches`, {
    method: 'POST',
    body: JSON.stringify({ ref: env.DEPLOY_BRANCH, inputs: { reason: 'Publié depuis /admin' } }),
  });
  if (dispatch.ok) return { triggered: true };

  // GitHub only starts workflow_dispatch for workflows on the default branch. Before the cutover
  // (deploy.yml not on master yet), rebuild by re-running the branch's latest deploy instead:
  // the rebuild downloads the newest published.json, so the result is the same.
  if (dispatch.status === 404 || dispatch.status === 422) {
    const run = await latestRun(env);
    if (!run) return { triggered: false, reason: 'Aucune mise en ligne précédente à relancer.' };
    if (run.status !== 'completed') {
      return { triggered: false, reason: 'Une mise en ligne est déjà en cours. Republiez dans deux minutes.' };
    }
    const rerun = await api(env, `/actions/runs/${run.id}/rerun`, { method: 'POST' });
    if (rerun.ok) return { triggered: true };
    return { triggered: false, reason: `GitHub a répondu ${rerun.status}: ${await rerun.text()}` };
  }
  return { triggered: false, reason: `GitHub a répondu ${dispatch.status}: ${await dispatch.text()}` };
};

export type DeployStatus = {
  status: 'queued' | 'in_progress' | 'completed' | 'unknown';
  conclusion: string | null;
  startedAt: string | null;
  url: string | null;
};

export const deployStatus = async (env: AppEnv): Promise<DeployStatus> => {
  const unknown: DeployStatus = { status: 'unknown', conclusion: null, startedAt: null, url: null };
  if (!env.GITHUB_TOKEN) return unknown;
  const run = await latestRun(env);
  if (!run) return unknown;
  const status = ['queued', 'in_progress', 'completed'].includes(run.status)
    ? (run.status as DeployStatus['status'])
    : 'in_progress';
  return { status, conclusion: run.conclusion, startedAt: run.run_started_at, url: run.html_url };
};

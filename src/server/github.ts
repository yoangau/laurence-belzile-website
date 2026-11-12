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

export const triggerDeploy = async (env: AppEnv): Promise<{ triggered: boolean; reason?: string }> => {
  if (!env.GITHUB_TOKEN) return { triggered: false, reason: 'GITHUB_TOKEN non configuré (publication locale seulement)' };
  const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/${WORKFLOW}/dispatches`, {
    method: 'POST',
    headers: headers(env.GITHUB_TOKEN),
    body: JSON.stringify({ ref: env.DEPLOY_BRANCH, inputs: { reason: 'Publié depuis /admin' } }),
  });
  if (!res.ok) return { triggered: false, reason: `GitHub a répondu ${res.status}: ${await res.text()}` };
  return { triggered: true };
};

export type DeployStatus = {
  status: 'queued' | 'in_progress' | 'completed' | 'unknown';
  conclusion: string | null;
  startedAt: string | null;
  url: string | null;
};

export const deployStatus = async (env: AppEnv): Promise<DeployStatus> => {
  if (!env.GITHUB_TOKEN) return { status: 'unknown', conclusion: null, startedAt: null, url: null };
  const res = await fetch(
    `https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/${WORKFLOW}/runs?per_page=1`,
    { headers: headers(env.GITHUB_TOKEN) },
  );
  if (!res.ok) return { status: 'unknown', conclusion: null, startedAt: null, url: null };
  const { workflow_runs: runs } = (await res.json()) as {
    workflow_runs: { status: string; conclusion: string | null; run_started_at: string; html_url: string }[];
  };
  const run = runs[0];
  if (!run) return { status: 'unknown', conclusion: null, startedAt: null, url: null };
  const status = ['queued', 'in_progress', 'completed'].includes(run.status) ? (run.status as DeployStatus['status']) : 'in_progress';
  return { status, conclusion: run.conclusion, startedAt: run.run_started_at, url: run.html_url };
};

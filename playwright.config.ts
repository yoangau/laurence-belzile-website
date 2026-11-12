/**
 * Browser tests against the local dev server (`npm run dev`, with migrated content).
 * Run with `npm run test:e2e`. They modify the local draft in .wrangler/state, then restore it.
 */
import { defineConfig, devices } from '@playwright/test';

/** Set E2E_BASE_URL to test another server, e.g. the production build under `wrangler dev`. */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:4321';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'off',
    ...devices['Desktop Chrome'],
    deviceScaleFactor: 1,
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'npx astro dev --port 4321', url: `${baseURL}/api/admin/me`, reuseExistingServer: true, timeout: 120_000 },
});

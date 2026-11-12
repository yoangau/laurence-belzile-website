/**
 * Browser tests against the local dev server (`npm run dev`, with migrated content).
 * Run with `npm run test:e2e`. They modify the local draft in .wrangler/state, then restore it.
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'off',
    ...devices['Desktop Chrome'],
    deviceScaleFactor: 1,
  },
  webServer: {
    command: 'npx astro dev --port 4321',
    url: 'http://localhost:4321/api/admin/me',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});

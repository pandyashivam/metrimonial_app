import { defineConfig, devices } from '@playwright/test';

/**
 * E2E configuration for the marketing site. The logged-in experience lives in the Expo
 * web build (apps/mobile → pnpm web) and is tested via its own suite; these tests cover
 * public pages, device-aware redirects, and basic SEO assertions.
 *
 * Run locally: pnpm --filter @shubhmilan/web e2e
 * CI: installed via `npx playwright install --with-deps` in the workflow.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

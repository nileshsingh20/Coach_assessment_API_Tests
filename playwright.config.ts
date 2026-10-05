import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  // These tests hit a real API and mutate directory/invitation state,
  // so keep them serial-friendly per-file; individual files that need
  // strict ordering already use test.describe.configure({ mode: 'serial' }).
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  // 'list' prints live progress to the console; 'html' writes the full
  // interactive report (every test, timings, failure diffs and request
  // details for API assertions) to playwright-report/index.html.
  // `npm run report` opens the most recent one in a browser.
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: process.env.COACH_ASSESS_BASE_URL || 'https://assess.coachlms.org/api/public/v1',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
    // If you're behind a corporate proxy or antivirus doing TLS
    // inspection, Playwright's network stack won't trust that proxy's
    // certificate the way curl/Windows does, and HTTPS calls can get
    // intercepted and returned as an HTML block/redirect page instead of
    // your real request reaching the API. This bypasses that check.
    // Local/dev-only — never rely on this in CI against a real key.
    ignoreHTTPSErrors: true,
  },
});

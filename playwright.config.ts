import { defineConfig, devices } from '@playwright/test';

/**
 * Browser checks (roadmap Phase 7): smoke (`e2e/smoke.pw.ts`) and axe scans (`e2e/a11y.pw.ts`) against the production build.
 * Files end in `.pw.ts` so Vitest never picks them up. Every request outside localhost is aborted, so runs are offline and repeatable.
 */
const PORT = 4173;
export default defineConfig({
  testDir: 'e2e',
  testMatch: /.*\.pw\.ts$/,
  timeout: 45_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  webServer: { command: `npm run build && npx vite preview --port ${PORT} --strictPort`, url: `http://localhost:${PORT}`, reuseExistingServer: !process.env.CI, timeout: 180_000 },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: { args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] } } }],
});

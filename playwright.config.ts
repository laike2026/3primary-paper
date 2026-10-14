import {defineConfig, devices} from '@playwright/test';
import {existsSync} from 'node:fs';

const localChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {timeout: 10_000},
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: existsSync(localChrome) ? {executablePath: localChrome} : {}
  },
  projects: [{name: 'chromium', use: {...devices['Desktop Chrome']}}],
  webServer: {
    command: 'pnpm dev --port 3100',
    url: 'http://127.0.0.1:3100/en',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});

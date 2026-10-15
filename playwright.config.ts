import {defineConfig, devices} from '@playwright/test';
import {existsSync} from 'node:fs';

const localChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = Number(process.env.E2E_PORT || 3103);

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {timeout: 10_000},
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: existsSync(localChrome) ? {executablePath: localChrome} : {}
  },
  projects: [{name: 'chromium', use: {...devices['Desktop Chrome']}}],
  webServer: {
    command: `pnpm dev --port ${port}`,
    url: `http://127.0.0.1:${port}/en`,
    env: {DATABASE_URL:'',DATABASE_URL_UNPOOLED:'',BLOB_READ_WRITE_TOKEN:'',RESEND_API_KEY:''},
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});

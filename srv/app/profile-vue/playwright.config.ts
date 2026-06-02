import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4000',
    headless: true,
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npm --prefix ../.. run --silent build:vue && npm --prefix ../.. start',
    url: 'http://localhost:4000/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ]
})

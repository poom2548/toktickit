import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    env: {
      TEST_TICKET_ID: '1',
      NEW_TICKET_ID: '4',
      RESOLVED_FLAG_TICKET_ID: '2',
      TICKET_WITH_ATTACHMENT_ID: '3'
    }
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
    cwd: './client',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

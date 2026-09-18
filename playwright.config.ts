import { defineConfig, devices } from '@playwright/test';

process.env.TEST_TICKET_ID = '9';
process.env.NEW_TICKET_ID = '2';
process.env.RESOLVED_FLAG_TICKET_ID = '3';
process.env.TICKET_WITH_ATTACHMENT_ID = '3';
process.env.ADMIN_ID = 'cmtz8vk5700099ih9jcb3k1j9';

export default defineConfig({
  globalSetup: './e2e/global-setup.ts',
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
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

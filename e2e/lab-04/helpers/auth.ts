import { Page, expect } from '@playwright/test';

const SEED_ACCOUNTS = {
  REQUESTER: { email: process.env.TEST_REQUESTER_EMAIL || 'alice@toktick.dev', password: process.env.TEST_REQUESTER_PASSWORD || 'SecurePass@123' },
  IT_STAFF: { email: process.env.TEST_STAFF_EMAIL || 'frank@toktick.dev', password: process.env.TEST_STAFF_PASSWORD || 'SecurePass@123' },
  ADMINISTRATOR: { email: process.env.TEST_ADMIN_EMAIL || 'admin@toktick.dev', password: process.env.TEST_ADMIN_PASSWORD || 'SecurePass@123' }
};

export async function loginAs(page: Page, role: keyof typeof SEED_ACCOUNTS) {
  const account = SEED_ACCOUNTS[role];
  await page.goto('/login');
  await page.fill('#email', account.email);
  await page.fill('#password', account.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.toString().includes('/login'));
}

export async function logout(page: Page) {
  const logoutBtn = page.getByRole('button', { name: /logout/i });
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForURL('**/login');
  }
}

export async function expectForbiddenPage(page: Page) {
  await expect(page.getByText(/forbidden/i, { ignoreCase: true })).toBeVisible();
}

export function collectConsoleErrors(page: Page, errors: string[]) {
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
}

export function collectFailedRequests(page: Page, failed: string[]) {
  page.on('response', response => {
    if (response.status() >= 400 && !response.url().includes('/auth/me')) { // /auth/me often 401s normally
      failed.push(`[${response.status()}] ${response.url()}`);
    }
  });
}

export async function visitAndCheckErrors(page: Page, routes: string[]) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const networkErrors: string[] = [];

  collectConsoleErrors(page, consoleErrors);
  collectFailedRequests(page, networkErrors);

  page.on('pageerror', err => pageErrors.push(err.message));

  for (const route of routes) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
  }

  return { consoleErrors, pageErrors, networkErrors };
}

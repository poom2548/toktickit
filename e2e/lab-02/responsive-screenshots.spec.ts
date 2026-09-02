import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'desktop', width: 1200, height: 800 },
  { name: 'tablet', width: 800, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
];

test.describe('Responsive Screenshots', () => {
  viewports.forEach((viewport) => {
    test(`Capture screens for ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      // Navigate and login
      await page.goto('/');
      
      // Wait for the requester selection screen to fully load its data from the backend
      await page.waitForLoadState('networkidle');

      // The context selector renders individual buttons for each requester — click the desired one
      await page.getByRole('button', { name: /Alice Johnson/i }).click();

      // After selection the Continue button becomes enabled; wait for it and click
      const continueBtn = page.getByRole('button', { name: /Continue/i });
      await continueBtn.waitFor({ state: 'visible' });
      await expect(continueBtn).toBeEnabled();
      await continueBtn.click();

      // Wait for app to load (e.g. navigation bar visible)
      await page.waitForLoadState('networkidle');

      // 1. My Tickets Screen
      await page.getByRole('button', { name: /My Tickets/i }).click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `artifacts/lab-02/screenshots/my-tickets/${viewport.name}.png`, fullPage: true });

      // 2. Create Ticket Screen
      await page.getByRole('button', { name: /New Ticket/i }).first().click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `artifacts/lab-02/screenshots/create-ticket/${viewport.name}.png`, fullPage: true });

      // 3. Ticket Detail Screen
      // We are on the Create Ticket form — use the "← Back" button to return to My Tickets
      await page.getByRole('button', { name: /Back/i }).click();
      await page.waitForLoadState('networkidle');

      // Look for the first ticket link/row in the table/list
      // This is a generic selector to find a ticket row/card and click it
      const firstTicket = page.locator('table tbody tr').first().or(page.locator('.ticket-card').first()).or(page.locator('a[href*="/tickets/"]').first());

      // Strictly assert a ticket exists — test must fail if none are found
      await expect(firstTicket).toBeVisible();
      await firstTicket.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `artifacts/lab-02/screenshots/ticket-detail/${viewport.name}.png`, fullPage: true });
    });
  });
});

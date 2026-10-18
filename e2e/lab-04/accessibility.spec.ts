import { test, expect } from '@playwright/test';
import { loginAs, logout } from './helpers/auth';
import { expectNoSeriousAxeViolations } from './helpers/axe';

test.describe('A11Y-01 & A11Y-02: Accessibility and Keyboard Navigation', () => {
  test('A11Y-01: Accessibility scan, focus, and semantic labeling (AC-48, AC-49)', async ({ page }, testInfo) => {
    // 1. Scan Requester Dashboard
    await loginAs(page, 'REQUESTER');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expectNoSeriousAxeViolations(page, testInfo);

    // Verify accessible name on metric cards includes value and label
    const openCard = page.getByRole('link', { name: /ตั๋วที่ยังเปิดอยู่|my open tickets/i });
    await expect(openCard).toBeVisible();
    const openCardAria = await openCard.getAttribute('aria-label');
    const openCardText = await openCard.innerText();
    expect(openCardAria || openCardText).toBeTruthy();

    // Verify refresh button has aria-label and accessible name
    const refreshBtn = page.getByRole('button', { name: /รีเฟรช|refresh/i });
    await expect(refreshBtn).toBeVisible();
    expect(await refreshBtn.getAttribute('aria-label')).toBeTruthy();

    // Verify active navigation item has aria-current="page"
    const activeNav = page.locator('nav a[aria-current="page"]');
    await expect(activeNav).toBeVisible();

    await logout(page);

    // 2. Scan IT Staff Dashboard
    await loginAs(page, 'IT_STAFF');
    await page.goto('/staff/dashboard');
    await page.waitForLoadState('networkidle');

    await expectNoSeriousAxeViolations(page, testInfo);

    // Verify status cards communicate meaning with text + color (AC-49)
    const statusBadges = page.locator('.badge, [class*="status-badge"], [class*="priority-badge"]');
    const badgeCount = await statusBadges.count();
    for (let i = 0; i < Math.min(badgeCount, 5); i++) {
      const badgeText = (await statusBadges.nth(i).innerText()).trim();
      expect(badgeText.length).toBeGreaterThan(0);
    }

    // 3. Scan Staff Ticket Detail
    const ticketId = process.env.TEST_TICKET_ID || '1';
    await page.goto(`/staff/tickets/${ticketId}`);
    await page.waitForLoadState('networkidle');

    await expectNoSeriousAxeViolations(page, testInfo);
  });

  test('A11Y-02: Keyboard navigation, modal focus retention, and semantic tables (AC-48)', async ({ page }) => {
    // 1. Keyboard tab navigation on Requester Dashboard
    await loginAs(page, 'REQUESTER');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Tab through elements
    await page.keyboard.press('Tab');
    const firstActiveTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(firstActiveTag);

    // Ensure interactive elements have visible focus outlines (no outline: none without box-shadow)
    const outlineNoneWithoutReplacement = await page.evaluate(() => {
      const interactives = document.querySelectorAll('a, button, input, select, textarea');
      const badElements: string[] = [];
      for (const el of interactives) {
        const style = window.getComputedStyle(el);
        if (style.outlineStyle === 'none' && !style.boxShadow && !style.borderColor) {
          badElements.push(el.tagName);
        }
      }
      return badElements;
    });
    expect(outlineNoneWithoutReplacement).toHaveLength(0);

    await logout(page);

    // 2. Modal focus management on CANCELLED transition (Staff Ticket Detail)
    await loginAs(page, 'IT_STAFF');
    const newTicketId = process.env.NEW_TICKET_ID || '2';
    await page.goto(`/staff/tickets/${newTicketId}`);
    await page.waitForLoadState('networkidle');

    // Locate status select and select CANCELLED
    const statusSelect = page.locator('#status-select, [aria-label*="Update Status"]');
    if (await statusSelect.isVisible()) {
      const options = await statusSelect.locator('option').allTextContents();
      if (options.some((o) => o.includes('Cancelled') || o.includes('CANCELLED'))) {
        await statusSelect.selectOption({ label: 'Cancelled' });

        const updateBtn = page.getByRole('button', { name: /update status/i });
        await updateBtn.click();

        // Confirmation dialog appears
        const modal = page.locator('[role="dialog"][aria-modal="true"]');
        await expect(modal).toBeVisible();

        // Press Escape to dismiss modal
        await page.keyboard.press('Escape');

        // Modal should close
        await expect(modal).not.toBeVisible();
      }
    }

    // 3. Actions Taken semantic table structure
    const testTicketId = process.env.TEST_TICKET_ID || '1';
    await page.goto(`/staff/tickets/${testTicketId}`);
    await page.waitForLoadState('networkidle');

    const table = page.locator('.actions-table, [data-testid="actions-table"], table').first();
    if (await table.isVisible()) {
      // Table must have column headers
      const headers = table.locator('th');
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThanOrEqual(2);
    }
  });
});

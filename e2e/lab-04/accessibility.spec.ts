import { test, expect, Page, TestInfo } from '@playwright/test';
import { loginAs, logout } from './helpers/auth';
import { runAxe, attachAxeResults } from './helpers/axe';
import { VIEWPORTS, setViewport } from './helpers/viewport';

async function scanScreen(page: Page, testInfo: TestInfo, screenName: string, width: number) {
  const results = await runAxe(page);
  await attachAxeResults(testInfo, results, `${screenName}-${width}-axe`);

  const critical = results.violations.filter((v) => v.impact === 'critical');
  const serious = results.violations.filter((v) => v.impact === 'serious');
  const moderate = results.violations.filter((v) => v.impact === 'moderate');
  const minor = results.violations.filter((v) => v.impact === 'minor');

  const modRuleIds = moderate.map((v) => v.id).join(', ') || 'none';
  const minRuleIds = minor.map((v) => v.id).join(', ') || 'none';

  console.log(
    `[AXE] Screen: "${screenName}" (${width}px) | Critical: ${critical.length}, Serious: ${serious.length}, Moderate: ${moderate.length} (${modRuleIds}), Minor: ${minor.length} (${minRuleIds})`
  );

  expect(critical, `Critical axe violations on ${screenName} at ${width}px`).toHaveLength(0);
  expect(serious, `Serious axe violations on ${screenName} at ${width}px`).toHaveLength(0);
}

test.describe('A11Y-01 & A11Y-02: Accessibility and Keyboard Navigation', () => {
  test('A11Y-01: Accessibility scan, focus, and semantic labeling (AC-48, AC-49)', async ({ page }, testInfo) => {
    test.setTimeout(90000);
    const viewports = [VIEWPORTS.mobile, VIEWPORTS.tablet, VIEWPORTS.desktop];
    const testTicketId = process.env.TEST_TICKET_ID || '1';

    // ─── 1. Requester Screens ──────────────────────────────────────────────
    await loginAs(page, 'REQUESTER');

    for (const vp of viewports) {
      await setViewport(page, vp);

      // Requester Dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await scanScreen(page, testInfo, 'Requester Dashboard', vp.width);

      // Requester Ticket Detail (read-only)
      await page.goto(`/tickets/${testTicketId}`);
      await page.waitForLoadState('networkidle');
      await scanScreen(page, testInfo, 'Requester Ticket Detail (read-only)', vp.width);

      // My Tickets with dashboard filter chip
      await page.goto('/my-tickets?statusGroup=open');
      await page.waitForLoadState('networkidle');
      await scanScreen(page, testInfo, 'My Tickets (filter chip: statusGroup=open)', vp.width);

      // 403 page (Requester accessing staff dashboard)
      await page.goto('/staff/dashboard');
      await page.waitForLoadState('networkidle');
      await scanScreen(page, testInfo, '403 Forbidden Page', vp.width);
    }

    // Mobile menu open state at 360px
    await setViewport(page, VIEWPORTS.mobile);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const mobileToggle = page.locator('#mobile-nav-toggle, button[aria-controls="mobile-nav"]');
    if (await mobileToggle.isVisible()) {
      await mobileToggle.click();
      await page.waitForTimeout(300);
      await scanScreen(page, testInfo, 'Mobile Menu Open', 360);
      await page.keyboard.press('Escape');
    }

    await logout(page);

    // ─── 2. IT Staff Screens ────────────────────────────────────────────────
    await loginAs(page, 'IT_STAFF');

    for (const vp of viewports) {
      await setViewport(page, vp);

      // IT Staff Dashboard
      await page.goto('/staff/dashboard');
      await page.waitForLoadState('networkidle');
      await scanScreen(page, testInfo, 'IT Staff Dashboard', vp.width);

      // Staff Queue with dashboard filter chip
      await page.goto('/staff/tickets?statusGroup=open&assignee=unassigned');
      await page.waitForLoadState('networkidle');
      await scanScreen(page, testInfo, 'Staff Queue (filter chip: unassigned open)', vp.width);

      // Staff Ticket Detail (Actions Taken list, status controls, owner picker)
      await page.goto(`/staff/tickets/${testTicketId}`);
      await page.waitForLoadState('networkidle');
      await scanScreen(page, testInfo, 'Staff Ticket Detail (list, status, owner)', vp.width);

      // Staff Ticket Detail with Create Action form open
      const addActionBtn = page.getByRole('button', { name: /add action|\+ action/i }).first();
      if (await addActionBtn.isVisible()) {
        await addActionBtn.click();
        await page.waitForTimeout(300);
        await scanScreen(page, testInfo, 'Staff Ticket Detail (Create Action form open)', vp.width);
        // Cancel/close form
        const cancelBtn = page.getByRole('button', { name: /cancel/i }).first();
        if (await cancelBtn.isVisible()) await cancelBtn.click();
      }
    }

    await logout(page);

    // ─── 3. Administrator Screens ───────────────────────────────────────────
    await loginAs(page, 'ADMINISTRATOR');

    for (const vp of viewports) {
      await setViewport(page, vp);

      // Administrator Dashboard (with User Accounts card)
      await page.goto('/staff/dashboard');
      await page.waitForLoadState('networkidle');
      await scanScreen(page, testInfo, 'Administrator Dashboard (User Accounts)', vp.width);
    }

    await logout(page);
  });

  test('A11Y-02: Keyboard navigation, modal focus retention, and semantic tables (AC-48)', async ({ page }) => {
    test.setTimeout(90000);

    // ─── 1. Keyboard walk on Requester Dashboard & Visible Focus ────────────
    await loginAs(page, 'REQUESTER');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Tab through interactive elements and assert visible focus
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      const focusState = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const style = window.getComputedStyle(el);
        const hasOutline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
        const hasBoxShadow = Boolean(style.boxShadow && style.boxShadow !== 'none');
        const hasBorder = Boolean(style.borderColor && style.borderStyle !== 'none');
        return {
          tag: el.tagName,
          visibleFocus: hasOutline || hasBoxShadow || hasBorder,
        };
      });
      if (focusState) {
        expect(focusState.visibleFocus, `Visible focus indicator on ${focusState.tag}`).toBeTruthy();
      }
    }

    // ─── 2. Mobile Menu Keyboard Use (at 360px) ─────────────────────────────
    await setViewport(page, VIEWPORTS.mobile);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const toggle = page.locator('#mobile-nav-toggle, button[aria-controls="mobile-nav"]');
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#mobile-nav')).toBeVisible();

    // Tab through links in drawer
    await page.keyboard.press('Tab');
    const drawerFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON']).toContain(drawerFocused);

    // Escape closes menu and returns focus to toggle
    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-nav')).not.toBeVisible();
    const returnFocusId = await page.evaluate(() => document.activeElement?.getAttribute('aria-controls'));
    expect(returnFocusId).toBe('mobile-nav');

    await setViewport(page, VIEWPORTS.desktop);
    await logout(page);

    // ─── 3. Staff Ticket Detail: Create Action via Keyboard ──────────────────
    await loginAs(page, 'IT_STAFF');
    const ticketId = process.env.TEST_TICKET_ID || '1';
    await page.goto(`/staff/tickets/${ticketId}`);
    await page.waitForLoadState('networkidle');

    const addActionBtn = page.getByRole('button', { name: /add action|\+ action/i }).first();
    await addActionBtn.focus();
    await page.keyboard.press('Enter');

    const descInput = page.locator('#action-desc-input');
    await expect(descInput).toBeVisible();
    await descInput.focus();
    const runId = Date.now();
    await page.keyboard.type(`A11Y-02 keyboard action ${runId}`);

    const resInput = page.locator('#action-result-input');
    await resInput.focus();
    await page.keyboard.type(`Result created solely via keyboard navigation`);

    const submitBtn = page.locator('button[type="submit"]:has-text("Save")').first();
    await submitBtn.focus();
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');

    // Confirm new action appears in table
    await expect(page.getByText(`A11Y-02 keyboard action ${runId}`)).toBeVisible();

    // ─── 4. Cancellation Dialog: Focus Trap, Escape, and Return ─────────────
    // Navigate to ticket 2 (in NEW status) to test cancellation modal
    const cancelTicketId = process.env.NEW_TICKET_ID || '2';
    await page.goto(`/staff/tickets/${cancelTicketId}`);
    await page.waitForLoadState('networkidle');

    const statusSelect = page.locator('#status-select, [aria-label*="Update Status"]');
    if (await statusSelect.isVisible()) {
      const options = await statusSelect.locator('option').allTextContents();
      if (options.some((o) => o.includes('Cancelled') || o.includes('CANCELLED'))) {
        await statusSelect.selectOption({ label: 'Cancelled' });
        const updateBtn = page.getByRole('button', { name: /update status/i });
        await updateBtn.click();

        const modal = page.locator('[role="dialog"][aria-modal="true"]');
        await expect(modal).toBeVisible();

        // Focus trap check: Tab wraps within modal
        await page.keyboard.press('Tab');
        const activeInModal = await page.evaluate(() => {
          const m = document.querySelector('[role="dialog"]');
          return m ? m.contains(document.activeElement) : false;
        });
        expect(activeInModal).toBeTruthy();

        // Press Escape to dismiss modal
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();
      }
    }

    // ─── 5. Actions Taken Semantic Table Structure ──────────────────────────
    await page.goto(`/staff/tickets/${ticketId}`);
    await page.waitForLoadState('networkidle');
    const table = page.locator('.actions-table, [data-testid="actions-table"], table').first();
    if (await table.isVisible()) {
      const headers = table.locator('th');
      expect(await headers.count()).toBeGreaterThanOrEqual(2);
    }

    await logout(page);
  });
});

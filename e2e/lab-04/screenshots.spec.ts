import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { loginAs, logout } from './helpers/auth';
import { VIEWPORTS, setViewport } from './helpers/viewport';

const SCREENSHOTS_ROOT = path.resolve('artifacts/lab-04/screenshots');

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function capture(page: any, subDir: string, screen: string, state: string, vp: typeof VIEWPORTS.mobile) {
  const dir = path.join(SCREENSHOTS_ROOT, subDir);
  ensureDir(dir);
  await setViewport(page, vp);
  await page.waitForTimeout(250);
  const filename = `${screen}-${state}-${vp.name}-${vp.width}.png`;
  await page.screenshot({ path: path.join(dir, filename), fullPage: true });
}

test.describe('SCREENSHOTS: Automated Visual Inspection Capture', () => {
  test.beforeEach(async () => {
    test.skip(process.env.CAPTURE_SCREENSHOTS !== '1', 'Screenshot capture skipped unless CAPTURE_SCREENSHOTS=1');
  });

  // ─── 1. Staff Dashboard ───────────────────────────────────────────────────
  test('Capture Staff Dashboard screenshots', async ({ page }) => {
    test.setTimeout(90000);
    const subDir = 'staff-dashboard';
    const screen = 'staff-dashboard';

    // 1.1 Default (IT Staff)
    await loginAs(page, 'IT_STAFF');
    await page.goto('/staff/dashboard');
    await page.waitForLoadState('networkidle');
    for (const vp of [VIEWPORTS.desktop, VIEWPORTS.tablet, VIEWPORTS.mobile]) {
      await capture(page, subDir, screen, 'default', vp);
    }

    // 1.2 Unset Priority focus
    const unsetCard = page.locator('[data-priority="UNSET"], :has-text("Not Set")').first();
    if (await unsetCard.isVisible()) {
      await unsetCard.scrollIntoViewIfNeeded();
    }
    for (const vp of [VIEWPORTS.desktop, VIEWPORTS.tablet, VIEWPORTS.mobile]) {
      await capture(page, subDir, screen, 'unset-priority', vp);
    }
    await logout(page);

    // 1.3 Administrator (User Accounts card visible)
    await loginAs(page, 'ADMINISTRATOR');
    await page.goto('/staff/dashboard');
    await page.waitForLoadState('networkidle');
    for (const vp of [VIEWPORTS.desktop, VIEWPORTS.tablet, VIEWPORTS.mobile]) {
      await capture(page, subDir, screen, 'admin', vp);
    }
    await logout(page);

    // 1.4 Mocked: Loading State
    await loginAs(page, 'IT_STAFF');
    await page.route('**/api/dashboard/staff**', async () => {});
    await page.goto('/staff/dashboard');
    await page.waitForTimeout(400);
    await capture(page, subDir, screen, 'loading-mocked', VIEWPORTS.desktop);
    await page.unroute('**/api/dashboard/staff**');

    // 1.5 Mocked: Empty Metrics
    await page.route('**/api/dashboard/staff**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          unassignedOpenCount: 0,
          myOpenCount: 0,
          recentlyResolvedCount: 0,
          totalOpenCount: 0,
          statusCounts: { NEW: 0, OPEN: 0, IN_PROGRESS: 0, WAITING_FOR_REQUESTER: 0, REOPENED: 0 },
          priorityCounts: { UNSET: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
        }),
      })
    );
    await page.goto('/staff/dashboard');
    await page.waitForLoadState('networkidle');
    await capture(page, subDir, screen, 'empty-mocked', VIEWPORTS.desktop);
    await page.unroute('**/api/dashboard/staff**');

    // 1.6 Mocked: Failure State
    await page.route('**/api/dashboard/staff**', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load staff dashboard metrics.',
        }),
      })
    );
    await page.goto('/staff/dashboard');
    await page.waitForLoadState('networkidle');
    await capture(page, subDir, screen, 'failure-mocked', VIEWPORTS.desktop);
    await page.unroute('**/api/dashboard/staff**');
    await logout(page);

    // 1.7 403 Forbidden State (Requester visits /staff/dashboard)
    await loginAs(page, 'REQUESTER');
    await page.goto('/staff/dashboard');
    await page.waitForLoadState('networkidle');
    for (const vp of [VIEWPORTS.desktop, VIEWPORTS.tablet, VIEWPORTS.mobile]) {
      await capture(page, subDir, screen, '403', vp);
    }
    await logout(page);
  });

  // ─── 2. Requester Dashboard ───────────────────────────────────────────────
  test('Capture Requester Dashboard screenshots', async ({ page }) => {
    test.setTimeout(90000);
    const subDir = 'requester-dashboard';
    const screen = 'requester-dashboard';

    // 2.1 Default (Requester)
    await loginAs(page, 'REQUESTER');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    for (const vp of [VIEWPORTS.desktop, VIEWPORTS.tablet, VIEWPORTS.mobile]) {
      await capture(page, subDir, screen, 'default', vp);
    }

    // 2.2 Mocked: Loading State
    await page.route('**/api/dashboard/requester**', async () => {});
    await page.goto('/dashboard');
    await page.waitForTimeout(400);
    await capture(page, subDir, screen, 'loading-mocked', VIEWPORTS.desktop);
    await page.unroute('**/api/dashboard/requester**');

    // 2.3 Mocked: Empty Metrics
    await page.route('**/api/dashboard/requester**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          openTicketsCount: 0,
          recentlyResolvedCount: 0,
          actionNeededCount: 0,
          highPriorityOpenCount: 0,
        }),
      })
    );
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await capture(page, subDir, screen, 'empty-mocked', VIEWPORTS.desktop);
    await page.unroute('**/api/dashboard/requester**');

    // 2.4 Mocked: Failure State
    await page.route('**/api/dashboard/requester**', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load requester dashboard metrics.',
        }),
      })
    );
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await capture(page, subDir, screen, 'failure-mocked', VIEWPORTS.desktop);
    await page.unroute('**/api/dashboard/requester**');
    await logout(page);

    // 2.5 403 Forbidden State (IT Staff visits /dashboard)
    await loginAs(page, 'IT_STAFF');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    for (const vp of [VIEWPORTS.desktop, VIEWPORTS.tablet, VIEWPORTS.mobile]) {
      await capture(page, subDir, screen, '403', vp);
    }
    await logout(page);
  });

  // ─── 3. Actions Taken ─────────────────────────────────────────────────────
  test('Capture Actions Taken screenshots', async ({ page }) => {
    test.setTimeout(90000);
    const subDir = 'actions-taken';
    const screen = 'actions-taken';

    // 3.1 Multiple Actions View (Staff on ticket 1)
    await loginAs(page, 'IT_STAFF');
    await page.goto('/staff/tickets/1');
    await page.waitForLoadState('networkidle');
    const actionsSection = page.locator('.actions-taken-section, :has-text("ประวัติการดำเนินงาน")').first();
    await actionsSection.scrollIntoViewIfNeeded();
    for (const vp of [VIEWPORTS.desktop, VIEWPORTS.tablet, VIEWPORTS.mobile]) {
      await capture(page, subDir, screen, 'multiple-actions', vp);
    }

    // 3.2 Create Form with Validation Errors
    const addBtn = page.getByRole('button', { name: /\+ เพิ่ม Action/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(200);
      const submitBtn = page.getByRole('button', { name: /บันทึก/i }).first();
      await submitBtn.click();
      await page.waitForTimeout(200);
      for (const vp of [VIEWPORTS.desktop, VIEWPORTS.mobile]) {
        await capture(page, subDir, screen, 'create-form-validation-errors', vp);
      }
      const cancelBtn = page.getByRole('button', { name: /ยกเลิก/i }).first();
      if (await cancelBtn.isVisible()) await cancelBtn.click();
    }

    // 3.3 Edit Form
    const editBtn = page.getByRole('button', { name: /แก้ไข/i }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(200);
      for (const vp of [VIEWPORTS.desktop, VIEWPORTS.mobile]) {
        await capture(page, subDir, screen, 'edit-form', vp);
      }
      const cancelEditBtn = page.getByRole('button', { name: /ยกเลิก/i }).first();
      if (await cancelEditBtn.isVisible()) await cancelEditBtn.click();
    }

    // 3.4 Conflict Banner (409 Stale Version on Action)
    await page.route('**/actions/**', (route) => {
      if (route.request().method() === 'POST' || route.request().method() === 'PUT') {
        return route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'CONFLICT',
            message: 'ข้อมูลถูกเปลี่ยนแปลงโดยผู้ใช้อื่น กรุณารีเฟรชหน้านี้เพื่อดูข้อมูลล่าสุด (Data was modified by another user)',
          }),
        });
      }
      return route.continue();
    });

    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.locator('#action-desc-input, textarea[name="description"]').first().fill('Conflicting action test');
      await page.locator('#action-result-input, textarea[name="result"]').first().fill('Conflicting result');
      await page.getByRole('button', { name: /บันทึก/i }).first().click();
      await page.waitForTimeout(300);
      await capture(page, subDir, screen, 'conflict-banner', VIEWPORTS.desktop);
    }
    await page.unroute('**/actions/**');

    // 3.5 Empty State (Legacy Ticket 11 with 0 actions)
    await page.goto('/staff/tickets/11');
    await page.waitForLoadState('networkidle');
    const legacyActions = page.locator('.actions-taken-section, :has-text("ประวัติการดำเนินงาน")').first();
    await legacyActions.scrollIntoViewIfNeeded();
    await capture(page, subDir, screen, 'empty-state', VIEWPORTS.desktop);

    // 3.6 Safe Failure Mocked
    await page.route('**/actions**', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Unable to load actions taken.',
          }),
        });
      }
      return route.continue();
    });
    await page.goto('/staff/tickets/1');
    await page.waitForLoadState('networkidle');
    await capture(page, subDir, screen, 'safe-failure-mocked', VIEWPORTS.desktop);
    await page.unroute('**/actions**');
    await logout(page);

    // 3.7 Requester Read-Only View (Requester on Ticket 1)
    await loginAs(page, 'REQUESTER');
    await page.goto('/tickets/1');
    await page.waitForLoadState('networkidle');
    const reqActions = page.locator('.actions-taken-section, :has-text("ประวัติการดำเนินงาน")').first();
    if (await reqActions.isVisible()) {
      await reqActions.scrollIntoViewIfNeeded();
    }
    for (const vp of [VIEWPORTS.desktop, VIEWPORTS.mobile]) {
      await capture(page, subDir, screen, 'requester-read-only', vp);
    }
    await logout(page);
  });

  // ─── 4. Workflow ──────────────────────────────────────────────────────────
  test('Capture Workflow screenshots', async ({ page }) => {
    test.setTimeout(90000);
    const subDir = 'workflow';
    const screen = 'workflow';

    // 4.1 Permitted Transitions & Status Controls
    await loginAs(page, 'IT_STAFF');
    await page.goto('/staff/tickets/1');
    await page.waitForLoadState('networkidle');
    const workflowSection = page.locator('.ticket-workflow-controls, :has-text("Ticket Operations & Workflow")').first();
    await workflowSection.scrollIntoViewIfNeeded();
    for (const vp of [VIEWPORTS.desktop, VIEWPORTS.mobile]) {
      await capture(page, subDir, screen, 'permitted-transitions', vp);
    }

    // 4.2 Owner Picker
    const ownerGroup = page.locator('.workflow-field-group:has-text("Ticket Owner")').first();
    if (await ownerGroup.isVisible()) {
      await ownerGroup.scrollIntoViewIfNeeded();
      await capture(page, subDir, screen, 'owner-picker', VIEWPORTS.desktop);
    }

    // 4.3 Resolution Gate Failure (attempt to resolve with unresolved gate)
    await page.route('**/status**', (route) => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'RESOLUTION_PRECONDITION_FAILED',
            message: 'Cannot resolve ticket: ticket has unresolved requester advisory or missing required actions taken.',
          }),
        });
      }
      return route.continue();
    });
    const statusSelect = page.locator('#status-select, select[aria-label*="Status"]').first();
    if (await statusSelect.isVisible()) {
      const options = await statusSelect.locator('option').allTextContents();
      const resolveOpt = options.find((o) => o.includes('RESOLVED') || o.includes('Resolved'));
      if (resolveOpt) {
        await statusSelect.selectOption({ label: resolveOpt });
        const updateBtn = page.getByRole('button', { name: /update status|เปลี่ยนสถานะ/i }).first();
        if (await updateBtn.isVisible()) {
          await updateBtn.click();
          await page.waitForTimeout(300);
          await capture(page, subDir, screen, 'resolution-gate-failure', VIEWPORTS.desktop);
        }
      }
    }
    await page.unroute('**/status**');

    // 4.4 Conflict Banner (409 Stale Version on Status)
    await page.route('**/status**', (route) => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'CONFLICT',
            message: 'Ticket was updated by another user. Please refresh and try again.',
          }),
        });
      }
      return route.continue();
    });
    if (await statusSelect.isVisible()) {
      const updateBtn = page.getByRole('button', { name: /update status|เปลี่ยนสถานะ/i }).first();
      if (await updateBtn.isVisible() && !(await updateBtn.isDisabled())) {
        await updateBtn.click();
        await page.waitForTimeout(300);
        await capture(page, subDir, screen, 'conflict-banner', VIEWPORTS.desktop);
      }
    }
    await page.unroute('**/status**');

    // 4.5 Requester Advisory Banner on IT Staff View (Ticket 3)
    await page.goto('/staff/tickets/3');
    await page.waitForLoadState('networkidle');
    const advisoryBanner = page.locator('.advisory-banner, .alert-info, :has-text("Problem Appears Resolved")').first();
    if (await advisoryBanner.isVisible()) {
      await advisoryBanner.scrollIntoViewIfNeeded();
    }
    for (const vp of [VIEWPORTS.desktop, VIEWPORTS.mobile]) {
      await capture(page, subDir, screen, 'requester-advisory', vp);
    }

    // 4.6 Terminal State / Resolved Ticket (Ticket 3)
    const terminalNote = page.locator('.terminal-status-note, :has-text("terminal state")').first();
    if (await terminalNote.isVisible()) {
      await terminalNote.scrollIntoViewIfNeeded();
    }
    await capture(page, subDir, screen, 'resolved-ticket', VIEWPORTS.desktop);
    await logout(page);

    // 4.7 Requester Cancel Modal & Advisory Button
    await loginAs(page, 'REQUESTER');
    await page.goto('/tickets/2');
    await page.waitForLoadState('networkidle');
    const cancelTicketBtn = page.getByRole('button', { name: /cancel ticket|ยกเลิกตั๋ว/i }).first();
    if (await cancelTicketBtn.isVisible()) {
      await cancelTicketBtn.scrollIntoViewIfNeeded();
      await capture(page, subDir, screen, 'cancel-modal', VIEWPORTS.desktop);
    }
    await logout(page);
  });

  // ─── 5. Regression ────────────────────────────────────────────────────────
  test('Capture Regression screenshots', async ({ page }) => {
    test.setTimeout(90000);
    const subDir = 'regression';
    const screen = 'regression';

    // 5.1 Login Screen
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    for (const vp of [VIEWPORTS.desktop, VIEWPORTS.mobile]) {
      await capture(page, subDir, screen, 'login', vp);
    }

    // 5.2 My Tickets (with drill-down chip)
    await loginAs(page, 'REQUESTER');
    await page.goto('/tickets?statusGroup=open');
    await page.waitForLoadState('networkidle');
    for (const vp of [VIEWPORTS.desktop, VIEWPORTS.mobile]) {
      await capture(page, subDir, screen, 'my-tickets', vp);
    }

    // 5.3 Requester Ticket Detail (with actions read-only)
    await page.goto('/tickets/1');
    await page.waitForLoadState('networkidle');
    for (const vp of [VIEWPORTS.desktop, VIEWPORTS.mobile]) {
      await capture(page, subDir, screen, 'requester-detail', vp);
    }
    await logout(page);

    // 5.4 IT Staff Queue (with drill-down chip)
    await loginAs(page, 'IT_STAFF');
    await page.goto('/staff/tickets?statusGroup=open&assignee=unassigned');
    await page.waitForLoadState('networkidle');
    for (const vp of [VIEWPORTS.desktop, VIEWPORTS.mobile]) {
      await capture(page, subDir, screen, 'staff-queue', vp);
    }

    // 5.5 IT Staff Ticket Detail (with Internal Notes pane visible)
    await page.goto('/staff/tickets/1');
    await page.waitForLoadState('networkidle');
    const notesPane = page.locator('.internal-notes-pane, [aria-label*="Internal Notes"]').first();
    if (await notesPane.isVisible()) {
      await notesPane.scrollIntoViewIfNeeded();
    }
    for (const vp of [VIEWPORTS.desktop, VIEWPORTS.mobile]) {
      await capture(page, subDir, screen, 'staff-detail', vp);
    }

    // 5.6 Mobile Menu Open
    await setViewport(page, VIEWPORTS.mobile);
    await page.goto('/staff/dashboard');
    await page.waitForLoadState('networkidle');
    const toggler = page.locator('.navbar-toggler, button[aria-label*="menu"], button[aria-label*="Toggle"]').first();
    if (await toggler.isVisible()) {
      await toggler.click();
      await page.waitForTimeout(300);
      await capture(page, subDir, screen, 'mobile-menu-open', VIEWPORTS.mobile);
    }
    await logout(page);

    // 5.7 Admin User Management
    await loginAs(page, 'ADMINISTRATOR');
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    for (const vp of [VIEWPORTS.desktop, VIEWPORTS.mobile]) {
      await capture(page, subDir, screen, 'admin-user-management', vp);
    }
    await logout(page);
  });
});

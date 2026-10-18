import { test, expect } from '@playwright/test';
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

test.describe('SCREENSHOTS: Automated Visual Inspection Capture', () => {
  test.beforeEach(async () => {
    test.skip(process.env.CAPTURE_SCREENSHOTS !== '1', 'Screenshot capture skipped unless CAPTURE_SCREENSHOTS=1');
  });

  test('Capture Requester Dashboard screenshots across viewports', async ({ page }) => {
    const outDir = path.join(SCREENSHOTS_ROOT, 'requester-dashboard');
    ensureDir(outDir);

    await loginAs(page, 'REQUESTER');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Desktop (1280px)
    await setViewport(page, VIEWPORTS.desktop);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, 'requester-dashboard-desktop.png'), fullPage: true });

    // Tablet (768px)
    await setViewport(page, VIEWPORTS.tablet);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, 'requester-dashboard-tablet.png'), fullPage: true });

    // Mobile (360px)
    await setViewport(page, VIEWPORTS.mobile);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, 'requester-dashboard-mobile.png'), fullPage: true });
  });

  test('Capture Staff Dashboard screenshots across viewports', async ({ page }) => {
    const outDir = path.join(SCREENSHOTS_ROOT, 'staff-dashboard');
    ensureDir(outDir);

    await loginAs(page, 'IT_STAFF');
    await page.goto('/staff/dashboard');
    await page.waitForLoadState('networkidle');

    // Desktop (1280px)
    await setViewport(page, VIEWPORTS.desktop);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, 'staff-dashboard-desktop.png'), fullPage: true });

    // Tablet (768px)
    await setViewport(page, VIEWPORTS.tablet);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, 'staff-dashboard-tablet.png'), fullPage: true });

    // Mobile (360px)
    await setViewport(page, VIEWPORTS.mobile);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, 'staff-dashboard-mobile.png'), fullPage: true });
  });

  test('Capture Actions Taken & Workflow screenshots across viewports', async ({ page }) => {
    const actionsDir = path.join(SCREENSHOTS_ROOT, 'actions-taken');
    const workflowDir = path.join(SCREENSHOTS_ROOT, 'workflow');
    ensureDir(actionsDir);
    ensureDir(workflowDir);

    await loginAs(page, 'IT_STAFF');
    const ticketId = process.env.TEST_TICKET_ID || '1';
    await page.goto(`/staff/tickets/${ticketId}`);
    await page.waitForLoadState('networkidle');

    // Desktop (1280px)
    await setViewport(page, VIEWPORTS.desktop);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(actionsDir, 'actions-taken-desktop.png'), fullPage: true });
    await page.screenshot({ path: path.join(workflowDir, 'ticket-workflow-desktop.png'), fullPage: true });

    // Tablet (768px)
    await setViewport(page, VIEWPORTS.tablet);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(actionsDir, 'actions-taken-tablet.png'), fullPage: true });

    // Mobile (360px)
    await setViewport(page, VIEWPORTS.mobile);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(actionsDir, 'actions-taken-mobile.png'), fullPage: true });
    await page.screenshot({ path: path.join(workflowDir, 'ticket-workflow-mobile.png'), fullPage: true });
  });
});

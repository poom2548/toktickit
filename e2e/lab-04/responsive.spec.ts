import { test, expect } from '@playwright/test';
import { loginAs, logout } from './helpers/auth';
import { VIEWPORTS, setViewport, expectNoHorizontalScroll, findClippedControls } from './helpers/viewport';

test.describe('RESP-01: Responsive Layout and Mobile Navigation (AC-47)', () => {
  test('RESP-01a: No horizontal scroll or clipped controls across viewports (360px, 768px, 1280px)', async ({ page }) => {
    // 1. Check Requester screens
    await loginAs(page, 'REQUESTER');

    const requesterUrls = ['/dashboard', '/my-tickets', `/tickets/${process.env.TEST_TICKET_ID || '1'}`];
    const viewports = [VIEWPORTS.mobile, VIEWPORTS.tablet, VIEWPORTS.desktop];

    for (const url of requesterUrls) {
      for (const vp of viewports) {
        await setViewport(page, vp);
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // Check horizontal scroll
        await expectNoHorizontalScroll(page);

        // Check clipped controls
        const clipped = await findClippedControls(page);
        expect(clipped).toHaveLength(0);
      }
    }

    await logout(page);

    // 2. Check IT Staff screens
    await loginAs(page, 'IT_STAFF');

    const staffUrls = ['/staff/dashboard', '/staff/tickets', `/staff/tickets/${process.env.TEST_TICKET_ID || '1'}`];

    for (const url of staffUrls) {
      for (const vp of viewports) {
        await setViewport(page, vp);
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // Check horizontal scroll
        await expectNoHorizontalScroll(page);

        // Check clipped controls
        const clipped = await findClippedControls(page);
        expect(clipped).toHaveLength(0);
      }
    }
  });

  test('RESP-01b: Mobile menu toggle interaction at <= 640px (AC-47)', async ({ page }) => {
    // 1. Set mobile viewport (360x800)
    await setViewport(page, VIEWPORTS.mobile);

    // 2. Login as REQUESTER
    await loginAs(page, 'REQUESTER');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Toggle button should be visible on mobile
    const toggleBtn = page.getByRole('button', { name: /toggle navigation menu|เมนู/i });
    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(toggleBtn).toHaveAttribute('aria-controls', 'mobile-nav');

    // Mobile nav drawer should be closed initially
    const mobileNav = page.locator('#mobile-nav');
    await expect(mobileNav).not.toBeVisible();

    // 3. Open mobile menu
    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    await expect(mobileNav).toBeVisible();

    // Verify navigation links are visible inside mobile menu
    const dashboardLink = mobileNav.getByRole('link', { name: /แดชบอร์ด|dashboard/i });
    const ticketsLink = mobileNav.getByRole('link', { name: /my tickets/i });
    await expect(dashboardLink).toBeVisible();
    await expect(ticketsLink).toBeVisible();

    // 4. Close via Escape key
    await page.keyboard.press('Escape');
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(mobileNav).not.toBeVisible();

    // Focus should be restored to toggle button
    const focusedTag = await page.evaluate(() => document.activeElement?.getAttribute('aria-controls'));
    expect(focusedTag).toBe('mobile-nav');

    // 5. Open mobile menu again and click a link to navigate
    await toggleBtn.click();
    await expect(mobileNav).toBeVisible();

    await ticketsLink.click();
    await page.waitForLoadState('networkidle');

    // URL should change to /tickets and menu should automatically close
    await expect(page).toHaveURL(/\/tickets/);
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(mobileNav).not.toBeVisible();
  });
});

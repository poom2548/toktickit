import { test, expect, Page } from '@playwright/test';
import { loginAs, logout } from './helpers/auth';
import { VIEWPORTS, setViewport, expectNoHorizontalScroll, findClippedControls } from './helpers/viewport';

async function expectNoOverlappingSiblings(page: Page) {
  const overlaps = await page.evaluate(() => {
    const interactives = Array.from(document.querySelectorAll('a, button, input, select, textarea, [role="button"]'))
      .filter((el): el is HTMLElement => {
        if (!(el instanceof HTMLElement)) return false;
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.opacity !== '0' &&
          rect.width > 0 &&
          rect.height > 0
        );
      });

    const bad: string[] = [];
    for (let i = 0; i < interactives.length; i++) {
      for (let j = i + 1; j < interactives.length; j++) {
        const elA = interactives[i];
        const elB = interactives[j];
        if (elA.parentElement === elB.parentElement) {
          const rA = elA.getBoundingClientRect();
          const rB = elB.getBoundingClientRect();
          // Allow minor border overlaps up to 2px
          const overlapX = Math.max(0, Math.min(rA.right, rB.right) - Math.max(rA.left, rB.left));
          const overlapY = Math.max(0, Math.min(rA.bottom, rB.bottom) - Math.max(rA.top, rB.top));
          if (overlapX > 2 && overlapY > 2) {
            bad.push(
              `${elA.tagName} overlaps ${elB.tagName} by ${overlapX.toFixed(1)}x${overlapY.toFixed(1)}`
            );
          }
        }
      }
    }
    return bad;
  });
  expect(overlaps, `Overlapping sibling interactive elements detected`).toHaveLength(0);
}

test.describe('RESP-01: Responsive Layout and Mobile Navigation (AC-47)', () => {
  test('RESP-01a: No horizontal scroll or clipped controls across viewports (360px, 768px, 1280px)', async ({ page }) => {
    test.setTimeout(90000);
    const viewports = [VIEWPORTS.mobile, VIEWPORTS.tablet, VIEWPORTS.desktop];
    const testTicketId = process.env.TEST_TICKET_ID || '1';

    // ─── 1. Requester Screens ──────────────────────────────────────────────
    await loginAs(page, 'REQUESTER');

    const requesterUrls = [
      '/dashboard',
      '/my-tickets',
      '/my-tickets?statusGroup=open',
      `/tickets/${testTicketId}`,
      '/staff/dashboard', // 403 page
    ];

    for (const url of requesterUrls) {
      for (const vp of viewports) {
        await setViewport(page, vp);
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // Check horizontal scroll
        await expectNoHorizontalScroll(page);

        // Check clipped controls
        const clipped = await findClippedControls(page);
        expect(clipped, `Clipped controls on ${url} at ${vp.width}px`).toHaveLength(0);

        // Check overlapping sibling controls
        await expectNoOverlappingSiblings(page);
      }
    }

    await logout(page);

    // ─── 2. IT Staff Screens ────────────────────────────────────────────────
    await loginAs(page, 'IT_STAFF');

    const staffUrls = [
      '/staff/dashboard',
      '/staff/tickets',
      '/staff/tickets?statusGroup=open&assignee=unassigned',
      `/staff/tickets/${testTicketId}`,
    ];

    for (const url of staffUrls) {
      for (const vp of viewports) {
        await setViewport(page, vp);
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // Check horizontal scroll
        await expectNoHorizontalScroll(page);

        // Check clipped controls
        const clipped = await findClippedControls(page);
        expect(clipped, `Clipped controls on ${url} at ${vp.width}px`).toHaveLength(0);

        // Check overlapping sibling controls
        await expectNoOverlappingSiblings(page);
      }
    }

    // Check Staff Ticket Detail with Create Action form open
    for (const vp of viewports) {
      await setViewport(page, vp);
      await page.goto(`/staff/tickets/${testTicketId}`);
      await page.waitForLoadState('networkidle');

      const addBtn = page.getByRole('button', { name: /เพิ่ม action|\+ action/i }).first();
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(200);

        await expectNoHorizontalScroll(page);
        const clipped = await findClippedControls(page);
        expect(clipped, `Clipped controls on Create Form at ${vp.width}px`).toHaveLength(0);
        await expectNoOverlappingSiblings(page);
      }
    }

    await logout(page);

    // ─── 3. Administrator Screens ───────────────────────────────────────────
    await loginAs(page, 'ADMINISTRATOR');

    for (const vp of viewports) {
      await setViewport(page, vp);
      await page.goto('/staff/dashboard');
      await page.waitForLoadState('networkidle');

      await expectNoHorizontalScroll(page);
      const clipped = await findClippedControls(page);
      expect(clipped, `Clipped controls on Admin Dashboard at ${vp.width}px`).toHaveLength(0);
      await expectNoOverlappingSiblings(page);
    }

    await logout(page);
  });

  test('RESP-01b: Mobile menu toggle interaction at <= 640px (AC-47)', async ({ page }) => {
    // 1. Set mobile viewport (360x800)
    await setViewport(page, VIEWPORTS.mobile);

    // 2. Login as REQUESTER
    await loginAs(page, 'REQUESTER');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Toggle button should be visible on mobile
    const toggleBtn = page.locator('#mobile-nav-toggle, button[aria-controls="mobile-nav"]');
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

    // URL should change to /tickets or /my-tickets and menu should automatically close
    await expect(page).toHaveURL(/\/(my-)?tickets/);
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(mobileNav).not.toBeVisible();

    await logout(page);
  });
});

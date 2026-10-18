import { test, expect } from '@playwright/test';
import { loginAs, logout } from './helpers/auth';

test.describe('E2E-05 & REG-04: Regression and Isolation', () => {
  test('E2E-05: Requester cannot see Internal Notes (AC-28, AC-43)', async ({ page }) => {
    const runId = Date.now();
    const testTicketId = process.env.TEST_TICKET_ID || '1';
    const noteContent = `E2E-05 internal note ${runId} - confidential staff note`;

    // 1. Staff logs in and posts an internal note on test ticket
    await loginAs(page, 'IT_STAFF');
    await page.goto(`/staff/tickets/${testTicketId}`);
    await page.waitForLoadState('networkidle');

    // Locate internal note textarea and add note
    const noteTextarea = page.locator(`#note-${testTicketId}, textarea[id*="note"]`).first();
    await expect(noteTextarea).toBeVisible();
    await noteTextarea.fill(noteContent);

    const addNoteBtn = page.getByRole('button', { name: /add note/i }).first();
    await addNoteBtn.click();
    await page.waitForLoadState('networkidle');

    // Verify note is visible to staff
    await expect(page.getByText(noteContent)).toBeVisible();

    // 2. Staff logs out
    await logout(page);

    // 3. Requester logs in and views the same ticket
    await loginAs(page, 'REQUESTER');
    await page.goto(`/tickets?id=${testTicketId}`);
    await page.waitForLoadState('networkidle');

    // Assert: internal note is completely hidden from requester UI
    await expect(page.getByText(noteContent)).not.toBeVisible();
    await expect(page.getByText(/internal note/i)).not.toBeVisible();

    // Assert: GET /api/tickets/:id API response does not leak internal notes to requester
    const apiResponse = await page.request.get(`/api/tickets/${testTicketId}`);
    expect(apiResponse.ok()).toBeTruthy();
    const ticketData = await apiResponse.json();
    const rawBody = JSON.stringify(ticketData);

    expect(rawBody).not.toContain(noteContent);
    expect(ticketData.notes).toBeUndefined();
  });

  test('REG-04: Clean console errors and no broken links across all screens (AC-46, AC-50)', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const failedRequests: string[] = [];

    // Capture console errors, page errors, and unexpected failed requests
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore favicon 404, normal 401 on /auth/me session checks, or expected aborts
        if (!text.includes('favicon.ico') && !text.includes('status of 404') && !text.includes('status of 401') && !text.includes('Download error:')) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    page.on('response', (response) => {
      if (response.status() >= 400) {
        const url = response.url();
        // Exclude /auth/me check before login and expected 404s
        if (!url.includes('/auth/me') && !url.includes('/favicon.ico')) {
          failedRequests.push(`[${response.status()}] ${url}`);
        }
      }
    });

    // 1. Visit Requester screens
    await loginAs(page, 'REQUESTER');
    const requesterRoutes = [
      '/dashboard',
      '/my-tickets',
      '/tickets',
      `/tickets?id=${process.env.TEST_TICKET_ID || '1'}`,
    ];

    for (const route of requesterRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // Verify no broken links on this page
      const hrefs = await page.$$eval('a[href]', (anchors) =>
        anchors.map((a) => a.getAttribute('href')).filter(Boolean)
      );
      for (const href of hrefs) {
        expect(href).not.toBe('');
        expect(href).not.toBe('#');
      }
    }

    await logout(page);

    // 2. Visit IT Staff screens
    await loginAs(page, 'IT_STAFF');
    const staffRoutes = [
      '/staff/dashboard',
      '/staff/tickets',
      `/staff/tickets/${process.env.TEST_TICKET_ID || '1'}`,
    ];

    for (const route of staffRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const hrefs = await page.$$eval('a[href]', (anchors) =>
        anchors.map((a) => a.getAttribute('href')).filter(Boolean)
      );
      for (const href of hrefs) {
        expect(href).not.toBe('');
        expect(href).not.toBe('#');
      }
    }

    await logout(page);

    // 3. Visit Administrator screens
    await loginAs(page, 'ADMINISTRATOR');
    const adminRoutes = [
      '/staff/dashboard',
      '/staff/tickets',
      '/admin/users',
    ];

    for (const route of adminRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
    }

    // Assert zero console errors, page errors, and unexpected failed requests
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });
});

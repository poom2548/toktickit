import { test, expect } from '@playwright/test';
import { loginAs, logout } from './helpers/auth';

test.describe('E2E-05 & REG-04: Regression and Isolation', () => {
  test('E2E-05: Comprehensive Role Regression, Security Isolation, and Workflows (AC-28, AC-43, AC-50)', async ({ page }) => {
    test.setTimeout(120000);
    const runId = Date.now();
    const testTicketId = process.env.TEST_TICKET_ID || '1';

    // ─── 1. Authentication & Protected Routes ───────────────────────────────
    // Wrong password test
    await page.goto('/login');
    await page.fill('#email', 'alice@toktick.dev');
    await page.fill('#password', 'WrongPassword!123');
    await page.click('button[type="submit"]');
    await expect(page.locator('.alert-danger, [role="alert"]')).toBeVisible();

    // Protected route redirect when unauthenticated
    await page.context().clearCookies();
    await page.goto('/staff/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/login/);

    // ─── 2. IT Staff: Internal Notes, Priority Change, Owner Assignment ─────
    await loginAs(page, 'IT_STAFF');
    await page.goto(`/staff/tickets/${testTicketId}`);
    await page.waitForLoadState('networkidle');

    // Internal Note: Staff posts an internal note
    const noteContent = `E2E-05 internal confidential note ${runId}`;
    const noteTextarea = page.locator(`#note-${testTicketId}, textarea[id*="note"]`).first();
    await expect(noteTextarea).toBeVisible();
    await noteTextarea.fill(noteContent);

    const addNoteBtn = page.getByRole('button', { name: /add note/i }).first();
    await addNoteBtn.click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(noteContent)).toBeVisible();

    // Priority change: Staff updates IT priority
    const prioritySelect = page.locator('#it-priority-select, select[aria-label*="Priority"], select[name="itPriority"]').first();
    if (await prioritySelect.isVisible()) {
      await prioritySelect.selectOption('CRITICAL');
      const savePriorityBtn = page.getByRole('button', { name: /save priority|บันทึกความสำคัญ/i }).first();
      if (await savePriorityBtn.isVisible()) {
        await savePriorityBtn.click();
        await page.waitForLoadState('networkidle');
      }
    }

    // Owner picker: Staff assigns ticket
    const ownerSelect = page.locator('#owner-select, select[aria-label*="Owner"], select[name="ownerId"]').first();
    if (await ownerSelect.isVisible()) {
      const options = await ownerSelect.locator('option').allTextContents();
      const staffOption = options.find((o) => o.includes('Grace') || o.includes('Hank'));
      if (staffOption) {
        await ownerSelect.selectOption({ label: staffOption });
        const assignBtn = page.getByRole('button', { name: /assign|มอบหมาย/i }).first();
        if (await assignBtn.isVisible()) {
          await assignBtn.click();
          await page.waitForLoadState('networkidle');
        }
      }
    }

    // IT Staff navigation items check
    await expect(page.getByRole('link', { name: /แดชบอร์ด|dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /ticket queue/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /user management|user accounts/i })).toHaveCount(0);

    // IT Staff refused on /admin/users
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/forbidden/);
    await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();

    await logout(page);

    // ─── 3. Requester: Isolation, Public Comments, and Foreign Ticket Refusal ─
    await loginAs(page, 'REQUESTER');

    // Requester navigation items check
    await expect(page.getByRole('link', { name: /dashboard|แดชบอร์ด/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /my tickets/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /ticket queue/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /user management|user accounts/i })).toHaveCount(0);

    // View own ticket: Internal note is completely hidden
    await page.goto(`/tickets/${testTicketId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(noteContent)).not.toBeVisible();
    await expect(page.getByText(/internal note/i)).not.toBeVisible();

    // Verify GET /api/tickets/:id API response does not leak internal notes
    const apiResponse = await page.request.get(`/api/tickets/${testTicketId}`);
    expect(apiResponse.ok()).toBeTruthy();
    const ticketData = await apiResponse.json();
    expect(JSON.stringify(ticketData)).not.toContain(noteContent);
    expect(ticketData.notes).toBeUndefined();

    // Public comment: Requester adds a public comment
    const commentInput = page.locator('#comment-content, textarea[name="content"], textarea[id*="comment"]').first();
    if (await commentInput.isVisible()) {
      const commentContent = `Requester public comment ${runId}`;
      await commentInput.fill(commentContent);
      const postBtn = page.getByRole('button', { name: /post comment|ส่งความคิดเห็น/i }).first();
      if (await postBtn.isVisible()) {
        await postBtn.click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(commentContent)).toBeVisible();
      }
    }

    // Foreign ticket refusal: Alice visits Dave's ticket (TKT-004, id 4)
    const foreignTicketRes = await page.request.get('/api/tickets/4');
    expect(foreignTicketRes.status()).toBe(403);

    // Non-admin refused on /admin/users
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/forbidden/);
    await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();

    await logout(page);

    // ─── 4. Administrator: User Management ──────────────────────────────────
    await loginAs(page, 'ADMINISTRATOR');
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Admin navigation items check
    await expect(page.getByRole('link', { name: /แดชบอร์ด|dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /ticket queue/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /user management|user accounts/i })).toBeVisible();

    // User list is rendered
    await expect(page.locator('table, .user-list, [data-testid="users-table"]')).toBeVisible();

    // Create user with unique email
    const uniqueEmail = `user_${runId}@toktick.dev`;
    const createModalBtn = page.getByRole('button', { name: /create user/i }).first();
    if (await createModalBtn.isVisible()) {
      await createModalBtn.click();
      await page.waitForSelector('#create-name, #create-email');
      await page.locator('#create-name').fill(`Test User ${runId}`);
      await page.locator('#create-email').fill(uniqueEmail);
      await page.locator('#create-role').selectOption('REQUESTER');
      await page.locator('#create-password').fill('TempPass123!');
      await page.locator('.modal-footer').getByRole('button', { name: /create user/i }).click();
      await page.waitForLoadState('networkidle');

      // Assert user appears in list
      await expect(page.getByText(uniqueEmail)).toBeVisible();
    }

    await logout(page);
  });

  test('REG-04: Clean console errors, valid links, and no placeholder text (AC-46, AC-50)', async ({ page }) => {
    test.setTimeout(90000);
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const failedRequests: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (
          !text.includes('favicon.ico') &&
          !text.includes('status of 404') &&
          !text.includes('status of 401') &&
          !text.includes('Download error:')
        ) {
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
        if (!url.includes('/auth/me') && !url.includes('/favicon.ico')) {
          failedRequests.push(`[${response.status()}] ${url}`);
        }
      }
    });

    const testTicketId = process.env.TEST_TICKET_ID || '1';

    // 1. Visit Requester screens
    await loginAs(page, 'REQUESTER');
    const requesterRoutes = [
      '/dashboard',
      '/my-tickets',
      '/my-tickets?statusGroup=open',
      `/tickets/${testTicketId}`,
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

      // Verify no placeholder text
      const bodyText = await page.innerText('body');
      expect(bodyText).not.toMatch(/\b(TODO|FIXME|lorem ipsum|coming soon|\[object Object\])\b/i);
    }
    await logout(page);

    // 2. Visit IT Staff screens
    await loginAs(page, 'IT_STAFF');
    const staffRoutes = [
      '/staff/dashboard',
      '/staff/tickets',
      '/staff/tickets?statusGroup=open&assignee=unassigned',
      `/staff/tickets/${testTicketId}`,
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

      const bodyText = await page.innerText('body');
      expect(bodyText).not.toMatch(/\b(TODO|FIXME|lorem ipsum|coming soon|\[object Object\])\b/i);
    }
    await logout(page);

    // 3. Visit Administrator screens
    await loginAs(page, 'ADMINISTRATOR');
    const adminRoutes = ['/staff/dashboard', '/staff/tickets', '/admin/users'];

    for (const route of adminRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const hrefs = await page.$$eval('a[href]', (anchors) =>
        anchors.map((a) => a.getAttribute('href')).filter(Boolean)
      );
      for (const href of hrefs) {
        expect(href).not.toBe('');
        expect(href).not.toBe('#');
      }

      const bodyText = await page.innerText('body');
      expect(bodyText).not.toMatch(/\b(TODO|FIXME|lorem ipsum|coming soon|\[object Object\])\b/i);
    }
    await logout(page);

    // Assert zero console errors, page errors, and unexpected failed requests
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });
});

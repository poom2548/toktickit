import { test, expect } from '@playwright/test';
import { loginAs, logout } from './helpers/auth';
import { expectNoHorizontalScroll, setViewport, VIEWPORTS } from './helpers/viewport';
import { expectNoSeriousAxeViolations } from './helpers/axe';

test.describe('E2E-03: Dashboards UI, Navigation, and Drill-Down Integration', () => {
  test('E2E-03a: Requester Dashboard renders metrics, navigation active state, and drill-down to filtered list', async ({ page }, testInfo) => {
    // 1. Log in as REQUESTER
    await loginAs(page, 'REQUESTER');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 2. Navigation item indication
    const dashboardNav = page.locator('nav').getByRole('link', { name: /แดชบอร์ด|dashboard/i }).first();
    await expect(dashboardNav).toBeVisible();
    await expect(dashboardNav).toHaveAttribute('href', '/dashboard');
    await expect(dashboardNav).toHaveAttribute('aria-current', 'page');

    // 3. Welcome section
    await expect(page.getByText(/ยินดีต้อนรับกลับ|welcome back/i)).toBeVisible();
    const refreshBtn = page.getByRole('button', { name: /รีเฟรชข้อมูลแดชบอร์ด|รีเฟรช|refresh/i });
    await expect(refreshBtn).toBeVisible();

    // 4. Metric cards
    const openTicketsCard = page.getByRole('link', { name: /ตั๋วที่ยังเปิดอยู่|my open tickets/i });
    await expect(openTicketsCard).toBeVisible();
    await expect(openTicketsCard).toHaveAttribute('href', '/my-tickets?statusGroup=open');

    const waitingCard = page.getByRole('link', { name: /รอฉันดำเนินการ|waiting for me/i });
    await expect(waitingCard).toBeVisible();
    await expect(waitingCard).toHaveAttribute('href', '/my-tickets?status=WAITING_FOR_REQUESTER');

    const resolvedCard = page.getByRole('link', { name: /แก้ปัญหาแล้วล่าสุด|recently resolved/i });
    await expect(resolvedCard).toBeVisible();
    await expect(resolvedCard).toHaveAttribute('href', '/my-tickets?status=RESOLVED&resolvedWithinDays=7');

    // 5. Quick Actions
    const myTicketsAction = page.locator('main').getByRole('link', { name: /my tickets|ดูตั๋วทั้งหมดของฉัน/i });
    await expect(myTicketsAction).toBeVisible();
    await expect(myTicketsAction).toHaveAttribute('href', '/my-tickets');

    // 6. Drill-down click to /my-tickets?statusGroup=open
    await openTicketsCard.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/my-tickets\?statusGroup=open/);

    // Verify Active Filter Chip and Clear button
    const activeChip = page.getByText(/ตัวกรองที่ใช้งานอยู่|active filter/i);
    await expect(activeChip).toBeVisible();
    const clearFilterBtn = page.getByRole('button', { name: /ล้างตัวกรอง|clear filter/i });
    await expect(clearFilterBtn).toBeVisible();

    // Click Clear filter
    await clearFilterBtn.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/my-tickets/);

    // 7. Responsive check at 360px
    await setViewport(page, VIEWPORTS.mobile);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expectNoHorizontalScroll(page);

    // 8. Accessibility scan
    await setViewport(page, VIEWPORTS.desktop);
    await expectNoSeriousAxeViolations(page, testInfo);
  });

  test('E2E-03b: IT Staff Dashboard renders metrics, status/priority buckets, and drill-down to staff queue', async ({ page }, testInfo) => {
    // 1. Log in as IT_STAFF
    await loginAs(page, 'IT_STAFF');
    await page.goto('/staff/dashboard');
    await page.waitForLoadState('networkidle');

    // 2. Navigation item indication
    const dashboardNav = page.locator('nav').getByRole('link', { name: /แดชบอร์ด|dashboard/i }).first();
    await expect(dashboardNav).toBeVisible();
    await expect(dashboardNav).toHaveAttribute('href', '/staff/dashboard');
    await expect(dashboardNav).toHaveAttribute('aria-current', 'page');

    // 3. Welcome section
    await expect(page.getByText(/ยินดีต้อนรับกลับ|welcome back/i)).toBeVisible();
    const refreshBtn = page.getByRole('button', { name: /รีเฟรชข้อมูลแดชบอร์ด|รีเฟรช|refresh/i });
    await expect(refreshBtn).toBeVisible();

    // 4. Metric cards
    const unassignedCard = page.getByRole('link', { name: /ยังไม่ได้มอบหมาย|unassigned/i });
    await expect(unassignedCard).toBeVisible();
    await expect(unassignedCard).toHaveAttribute('href', '/staff/tickets?statusGroup=open&assignee=unassigned');

    const myOwnedCard = page.getByRole('link', { name: /คิวของฉัน|my owned/i });
    await expect(myOwnedCard).toBeVisible();
    await expect(myOwnedCard).toHaveAttribute('href', '/staff/tickets?statusGroup=open&assignee=me');

    // 5. By Status and By IT Priority buckets
    await expect(page.getByText(/ตามสถานะ|by status/i)).toBeVisible();
    const inProgressBucket = page.getByRole('link', { name: /IN_PROGRESS/i });
    await expect(inProgressBucket).toBeVisible();
    await expect(inProgressBucket).toHaveAttribute('href', '/staff/tickets?status=IN_PROGRESS');

    await expect(page.getByText(/ตามระดับความสำคัญ|by it priority/i)).toBeVisible();
    const unsetBucket = page.getByRole('link', { name: /UNSET|ยังไม่ระบุ/i });
    await expect(unsetBucket).toBeVisible();
    await expect(unsetBucket).toHaveAttribute('href', '/staff/tickets?statusGroup=open&priority=UNSET');

    // 6. User accounts should be hidden for IT_STAFF
    await expect(page.getByText(/user accounts/i)).not.toBeVisible();

    // 7. Drill-down click to /staff/tickets?statusGroup=open&assignee=unassigned
    await unassignedCard.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/staff\/tickets\?statusGroup=open&assignee=unassigned/);

    // Verify Active Filter Chip and Clear button
    const activeChip = page.getByText(/ตัวกรองที่ใช้งานอยู่|active filter/i);
    await expect(activeChip).toBeVisible();
    const clearFilterBtn = page.getByRole('button', { name: /ล้างตัวกรอง|clear filter/i });
    await expect(clearFilterBtn).toBeVisible();

    // Click Clear filter
    await clearFilterBtn.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/staff\/tickets/);

    // 8. Responsive check at 360px
    await setViewport(page, VIEWPORTS.mobile);
    await page.goto('/staff/dashboard');
    await page.waitForLoadState('networkidle');
    await expectNoHorizontalScroll(page);

    // 9. Accessibility scan
    await setViewport(page, VIEWPORTS.desktop);
    await expectNoSeriousAxeViolations(page, testInfo);
  });

  test('E2E-03c: Administrator sees User Accounts metrics on Staff Dashboard', async ({ page }) => {
    // 1. Log in as ADMINISTRATOR
    await loginAs(page, 'ADMINISTRATOR');
    await page.goto('/staff/dashboard');
    await page.waitForLoadState('networkidle');

    // 2. User accounts card should be visible
    await expect(page.getByText(/user accounts/i)).toBeVisible();
    await expect(page.getByText(/^active$|ใช้งานอยู่ \(active\)/i)).toBeVisible();
  });

  test('E2E-03d: IT Staff accessing Requester Dashboard shows 403 page with back link to Staff Dashboard', async ({ page }) => {
    // 1. IT_STAFF attempts to access Requester Dashboard (/dashboard)
    await loginAs(page, 'IT_STAFF');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Expect 403 Forbidden page or banner with link back to /staff/dashboard
    await expect(page.getByText(/403|ไม่มีสิทธิ์|forbidden/i)).toBeVisible();
    const backToStaff = page.getByRole('link', { name: /แดชบอร์ดเจ้าหน้าที่|staff dashboard|\/staff\/dashboard/i });
    await expect(backToStaff).toBeVisible();
    await backToStaff.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/staff\/dashboard/);
  });

  test('E2E-03e: Requester accessing Staff Dashboard shows 403 page with back link to Requester Dashboard', async ({ page }) => {
    // 1. REQUESTER attempts to access Staff Dashboard (/staff/dashboard)
    await loginAs(page, 'REQUESTER');
    await page.goto('/staff/dashboard');
    await page.waitForLoadState('networkidle');

    // Expect 403 Forbidden page with link back to /dashboard
    await expect(page.getByText(/403|ไม่มีสิทธิ์|forbidden/i)).toBeVisible();
    const backToRequester = page.getByRole('link', { name: /แดชบอร์ดผู้ร้องขอ|requester dashboard|\/dashboard/i });
    await expect(backToRequester).toBeVisible();
    await backToRequester.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

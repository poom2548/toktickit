const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://127.0.0.1:5173';

const ADMIN     = { email: 'admin@toktick.dev',  password: 'Dev@123456' };
const STAFF     = { email: 'frank@toktick.dev',  password: 'Dev@123456' };
const REQUESTER = { email: 'alice@toktick.dev',  password: 'Dev@123456' };

const SCREENSHOT_BASE = path.join('c:\\', 'KMUTT', 'SE', 'toktickit', 'artifacts', 'lab-03', 'screenshots');

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet:  { width: 768,  height: 1024 },
  mobile:  { width: 390,  height: 844 },
};

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#email', { timeout: 8000 });
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  // Wait for redirect away from login
  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function shot(page, filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  await page.screenshot({ path: filePath, fullPage: true });
  console.log('  saved:', path.basename(filePath));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  console.log('Playwright browser started\n');

  // ─────────────────────────────────────────────────────────────────────────
  // 1. LOGIN PAGE
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[1] Login page screenshots');
  for (const [vp, size] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport: size });
    const page = await ctx.newPage();

    // Clean login
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#email', { timeout: 8000 });
    await shot(page, `${SCREENSHOT_BASE}/authentication/login-${vp}.png`);

    // Error state
    await page.fill('#email', 'wrong@example.com');
    await page.fill('#password', 'badpassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await shot(page, `${SCREENSHOT_BASE}/authentication/login-error-${vp}.png`);

    await ctx.close();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. CHANGE PASSWORD PAGE — use Eve who requiresPasswordChange=true (InitPass@1)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[2] Change password page screenshots');
  for (const [vp, size] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport: size });
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#email', { timeout: 8000 });
    await page.fill('#email', 'eve@toktick.dev');
    await page.fill('#password', 'InitPass@1');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => url.includes('/change-password'), { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(800);
    await shot(page, `${SCREENSHOT_BASE}/change-password/change-password-${vp}.png`);
    await ctx.close();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. STAFF TICKET QUEUE
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[3] Staff ticket queue screenshots');
  for (const [vp, size] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport: size });
    const page = await ctx.newPage();
    await login(page, STAFF.email, STAFF.password);
    await page.goto(`${BASE_URL}/staff/tickets`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await shot(page, `${SCREENSHOT_BASE}/staff-queue/queue-${vp}.png`);

    if (vp === 'desktop') {
      // No-results state
      const searchInput = page.locator('#queue-search');
      await searchInput.fill('zzz_no_match_xyz_99999');
      await page.waitForTimeout(1000);
      await shot(page, `${SCREENSHOT_BASE}/staff-queue/queue-empty-results-${vp}.png`);
    }
    await ctx.close();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. STAFF TICKET DETAIL
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[4] Staff ticket detail screenshots');
  for (const [vp, size] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport: size });
    const page = await ctx.newPage();
    await login(page, STAFF.email, STAFF.password);
    await page.goto(`${BASE_URL}/staff/tickets`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Find and click first Open Detail button that is actually visible
    const detailBtn = page.locator('button:has-text("Open Detail") >> visible=true').first();
    const count = await detailBtn.count();
    if (count > 0) {
      await detailBtn.click();
      await page.waitForURL(url => url.includes('/staff/tickets/'), { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(1500);
      await shot(page, `${SCREENSHOT_BASE}/staff-ticket-detail/detail-${vp}.png`);
    } else {
      console.log(`  ⚠ No tickets visible on ${vp}, capturing queue`);
      await shot(page, `${SCREENSHOT_BASE}/staff-ticket-detail/detail-${vp}.png`);
    }
    await ctx.close();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. USER MANAGEMENT (Admin)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[5] User management screenshots');
  for (const [vp, size] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport: size });
    const page = await ctx.newPage();
    await login(page, ADMIN.email, ADMIN.password);
    await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await shot(page, `${SCREENSHOT_BASE}/user-management/user-management-${vp}.png`);

    if (vp === 'desktop') {
      // Create User modal
      const createBtn = page.locator('[data-testid="create-user-btn"]');
      if (await createBtn.count() > 0) {
        await createBtn.click();
        await page.waitForTimeout(600);
        await shot(page, `${SCREENSHOT_BASE}/user-management/create-user-modal-${vp}.png`);
        // Close modal via Escape or close button
        const closeBtn = page.locator('.modal-close-btn').first();
        if (await closeBtn.count() > 0) await closeBtn.click();
        else await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
      }

      // Edit User modal — click first edit button
      const editBtn = page.locator('[data-testid^="edit-user-btn-"]').first();
      if (await editBtn.count() > 0) {
        await editBtn.click();
        await page.waitForTimeout(600);
        await shot(page, `${SCREENSHOT_BASE}/user-management/edit-user-modal-${vp}.png`);
      }
    }
    await ctx.close();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. REQUESTER TICKET DETAIL
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[6] Requester ticket detail screenshots');
  for (const [vp, size] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport: size });
    const page = await ctx.newPage();
    await login(page, REQUESTER.email, REQUESTER.password);
    await page.waitForTimeout(800);

    // Click "My Tickets" button if on dashboard
    const myTicketsBtn = page.locator('button:has-text("My Tickets")').first();
    if (await myTicketsBtn.count() > 0) {
      await myTicketsBtn.click();
      await page.waitForTimeout(1000);
    }

    // Click first ticket card to open detail
    const ticketCard = page.locator('[data-testid="ticket-card"] >> visible=true').first();
    const ticketRow  = page.locator('.ticket-row >> visible=true').first();

    if (await ticketCard.count() > 0) {
      await ticketCard.click();
      await page.waitForTimeout(1200);
    } else if (await ticketRow.count() > 0) {
      await ticketRow.click();
      await page.waitForTimeout(1200);
    }

    await shot(page, `${SCREENSHOT_BASE}/requester-ticket-detail/requester-detail-${vp}.png`);
    await ctx.close();
  }

  await browser.close();
  console.log('\n✅ All screenshots done!');
})().catch(err => {
  console.error('\n❌ Script failed:', err.message);
  process.exit(1);
});

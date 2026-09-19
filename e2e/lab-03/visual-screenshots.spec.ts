import { test, Page } from '@playwright/test'
import path from 'path'

const SCREENSHOTS = path.resolve('artifacts/lab-03/screenshots')

const BREAKPOINTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet',  width: 900,  height: 1024 },
  { name: 'mobile',  width: 375,  height: 812 },
]

async function loginAs(page: Page, email: string, password: string, expectedPath?: string) {
  await page.goto('/login')
  await page.waitForSelector('#email')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
  if (expectedPath) {
    await page.waitForURL(url => url.pathname.includes(expectedPath), { timeout: 15000 })
  } else {
    await page.waitForTimeout(2000)
  }
}

// ── AUTHENTICATION ──────────────────────────────────────────────────────────

test('Screenshot: Login page — default state', async ({ page }) => {
  for (const bp of BREAKPOINTS) {
    await page.setViewportSize({ width: bp.width, height: bp.height })
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: `${SCREENSHOTS}/authentication/login-${bp.name}.png`, fullPage: true })
  }
})

test('Screenshot: Login page — error state', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/login')
  await page.fill('#email', 'wrong@toktick.dev')
  await page.fill('#password', 'wrongpassword')
  await page.click('button[type="submit"]')
  // Wait for error to appear
  await page.waitForSelector('[role="alert"], .field-error, .error-message', { timeout: 5000 })
  await page.screenshot({ path: `${SCREENSHOTS}/authentication/login-error-desktop.png`, fullPage: true })
})

test('Screenshot: Change Password page', async ({ page }) => {
  for (const bp of BREAKPOINTS) {
    await page.setViewportSize({ width: bp.width, height: bp.height })
    // Navigate directly — page may redirect to /login if not authenticated,
    // which is fine for showing the route structure
    await page.goto('/change-password')
    await page.waitForLoadState('networkidle')
    await page.screenshot({
      path: `${SCREENSHOTS}/authentication/change-password-${bp.name}.png`,
      fullPage: true,
    })
  }
})

// ── IT STAFF QUEUE ──────────────────────────────────────────────────────────

test('Screenshot: IT Staff Ticket Queue', async ({ page }) => {
  await loginAs(page, 'frank@toktick.dev', 'Dev@123456', 'staff/tickets')
  for (const bp of BREAKPOINTS) {
    await page.setViewportSize({ width: bp.width, height: bp.height })
    await page.goto('/staff/tickets')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('.staff-queue-page', { timeout: 10000 })
    await page.screenshot({ path: `${SCREENSHOTS}/staff-queue/queue-${bp.name}.png`, fullPage: true })
  }
})

test('Screenshot: IT Staff Queue — search active', async ({ page }) => {
  await loginAs(page, 'frank@toktick.dev', 'Dev@123456', 'staff/tickets')
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/staff/tickets')
  await page.waitForSelector('.staff-queue-page')
  // Type a search term
  const search = page.locator('[data-testid="search-input"], #queue-search, input[type="search"]').first()
  await search.fill('test')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${SCREENSHOTS}/staff-queue/queue-search-desktop.png`, fullPage: true })
})

test('Screenshot: IT Staff Queue — empty results', async ({ page }) => {
  await loginAs(page, 'frank@toktick.dev', 'Dev@123456', 'staff/tickets')
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/staff/tickets')
  await page.waitForSelector('.staff-queue-page')
  const search = page.locator('[data-testid="search-input"], #queue-search, input[type="search"]').first()
  await search.fill('XXXXXXXXXXX_NO_RESULTS')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${SCREENSHOTS}/staff-queue/queue-empty-desktop.png`, fullPage: true })
})

// ── IT STAFF TICKET DETAIL ──────────────────────────────────────────────────

test('Screenshot: IT Staff Ticket Detail', async ({ page }) => {
  await loginAs(page, 'frank@toktick.dev', 'Dev@123456', 'staff/tickets')
  await page.goto('/staff/tickets')
  await page.waitForSelector('button:has-text("Open Detail")', { state: 'attached', timeout: 10000 })
  // Click the first Open Detail button
  await page.click('button:has-text("Open Detail")')
  await page.waitForURL(/\/staff\/tickets\/[^/]+$/)
  await page.waitForLoadState('networkidle')
  const detailUrl = page.url()

  for (const bp of BREAKPOINTS) {
    await page.setViewportSize({ width: bp.width, height: bp.height })
    await page.goto(detailUrl)
    await page.waitForLoadState('networkidle')
    await page.screenshot({
      path: `${SCREENSHOTS}/staff-ticket-detail/detail-${bp.name}.png`,
      fullPage: true,
    })
  }
})

test('Screenshot: IT Staff Ticket Detail — operational section focus', async ({ page }) => {
  await loginAs(page, 'frank@toktick.dev', 'Dev@123456', 'staff/tickets')
  await page.goto('/staff/tickets')
  await page.waitForSelector('button:has-text("Open Detail")', { state: 'attached', timeout: 10000 })
  await page.click('button:has-text("Open Detail")')
  await page.waitForURL(/\/staff\/tickets\/[^/]+$/)
  await page.waitForLoadState('networkidle')
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.screenshot({ path: `${SCREENSHOTS}/staff-ticket-detail/detail-operations-desktop.png`, fullPage: false })
})

// ── REQUESTER TICKET DETAIL ─────────────────────────────────────────────────

test('Screenshot: Requester Ticket Detail', async ({ page }) => {
  await loginAs(page, 'alice@toktick.dev', 'Dev@123456', 'tickets')
  for (const bp of BREAKPOINTS) {
    await page.setViewportSize({ width: bp.width, height: bp.height })
    await page.goto('/tickets')
    await page.waitForLoadState('networkidle')
    // Try to navigate into a ticket detail
    const detailLink = page.locator('a[href*="/tickets/"], button:has-text("View"), button:has-text("Open")').first()
    if (await detailLink.isVisible({ timeout: 3000 })) {
      await detailLink.click()
      await page.waitForURL(/\/tickets\/[^/]+$/)
      await page.waitForLoadState('networkidle')
    }
    await page.screenshot({
      path: `${SCREENSHOTS}/staff-ticket-detail/requester-view-${bp.name}.png`,
      fullPage: true,
    })
  }
})

// ── ADMIN USER MANAGEMENT ───────────────────────────────────────────────────

test('Screenshot: Admin User Management — table view', async ({ page }) => {
  await loginAs(page, 'admin@toktickit.dev', 'Dev@123456', 'admin/users')
  for (const bp of BREAKPOINTS) {
    await page.setViewportSize({ width: bp.width, height: bp.height })
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('[data-testid="user-table"], table', { timeout: 10000 })
    await page.screenshot({
      path: `${SCREENSHOTS}/user-management/user-management-${bp.name}.png`,
      fullPage: true,
    })
  }
})

test('Screenshot: Admin — Create User modal', async ({ page }) => {
  await loginAs(page, 'admin@toktickit.dev', 'Dev@123456', 'admin/users')
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/admin/users')
  await page.waitForSelector('[data-testid="create-user-btn"]')
  await page.click('[data-testid="create-user-btn"]')
  await page.waitForSelector('[role="dialog"]')
  await page.screenshot({ path: `${SCREENSHOTS}/user-management/create-user-modal-desktop.png` })
})

test('Screenshot: Admin — Edit User modal (pre-populated)', async ({ page }) => {
  await loginAs(page, 'admin@toktickit.dev', 'Dev@123456', 'admin/users')
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/admin/users')
  await page.waitForSelector('[data-testid^="edit-user-btn-"]')
  await page.click('[data-testid^="edit-user-btn-"]')
  await page.waitForSelector('[role="dialog"]')
  await page.screenshot({ path: `${SCREENSHOTS}/user-management/edit-user-modal-desktop.png` })
})

test('Screenshot: Admin — non-Admin sees forbidden screen', async ({ page }) => {
  await loginAs(page, 'frank@toktick.dev', 'Dev@123456', 'staff/tickets')
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/admin/users')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${SCREENSHOTS}/user-management/forbidden-desktop.png`, fullPage: true })
})

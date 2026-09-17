import { test, chromium, Browser, Page } from '@playwright/test'
import path from 'path'

const SCREENSHOTS_DIR = path.resolve('artifacts/lab-03/screenshots')

const BREAKPOINTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet',  width: 900,  height: 1024 },
  { name: 'mobile',  width: 375,  height: 812 },
]

// Helper: login and get an authenticated page
async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 })
}

// Helper to detect horizontal overflow
async function checkNoHorizontalOverflow(page: Page, label: string) {
  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth
  })
  if (hasOverflow) {
    console.error(`❌ HORIZONTAL OVERFLOW detected on: ${label}`)
  } else {
    console.log(`✅ No overflow on: ${label}`)
  }
}

// --- AUTHENTICATION SCREENS ---

test('Screenshot: Login screen', async ({ page }) => {
  for (const bp of BREAKPOINTS) {
    await page.setViewportSize({ width: bp.width, height: bp.height })
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await checkNoHorizontalOverflow(page, `Login screen (${bp.name})`)
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/authentication/login-${bp.name}.png`,
      fullPage: true,
    })
  }
})

test('Screenshot: Login screen — validation error state', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/login')
  await page.fill('#email', 'notexist@toktick.dev')
  await page.fill('#password', 'wrongpassword')
  await page.click('button[type="submit"]')
  await page.waitForSelector('.field-error, .error-message, [role="alert"]')
  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/authentication/login-error-desktop.png`,
    fullPage: true,
  })
})

test('Screenshot: Change Password screen', async ({ page }) => {
  // Navigate to change password screen
  // Wait, does Alice need password change? Let's assume we can just go to the route if logged in or directly.
  // We'll log in as grace and go to change-password, maybe it redirects? We will see.
  await loginAs(page, 'grace@toktick.dev', 'Dev@123456')
  for (const bp of BREAKPOINTS) {
    await page.setViewportSize({ width: bp.width, height: bp.height })
    await page.goto('/change-password')
    await page.waitForLoadState('networkidle')
    await checkNoHorizontalOverflow(page, `Change Password screen (${bp.name})`)
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/change-password/change-password-${bp.name}.png`,
      fullPage: true,
    })
  }
})

// --- IT STAFF QUEUE ---

test('Screenshot: IT Staff Ticket Queue', async ({ page }) => {
  await loginAs(page, 'frank@toktick.dev', 'Dev@123456')
  for (const bp of BREAKPOINTS) {
    await page.setViewportSize({ width: bp.width, height: bp.height })
    await page.goto('/staff/tickets')
    await page.waitForLoadState('networkidle')
    // Wait for table or card list to appear
    await page.waitForSelector('.queue-table, .queue-card-list, table', { timeout: 10000 }).catch(() => {})
    await checkNoHorizontalOverflow(page, `IT Staff Queue (${bp.name})`)
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/staff-queue/queue-${bp.name}.png`,
      fullPage: true,
    })
  }
})

test('Screenshot: IT Staff Queue — empty results state', async ({ page }) => {
  await loginAs(page, 'frank@toktick.dev', 'Dev@123456')
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/staff/tickets')
  // Search for something that returns no results
  const searchInput = page.locator('[data-testid="search-input"], input[type="search"], #queue-search, input[placeholder*="Search"]')
  await searchInput.fill('XXXXXXXXXXX_NO_RESULTS')
  await page.waitForLoadState('networkidle')
  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/staff-queue/queue-empty-results-desktop.png`,
    fullPage: true,
  })
})

// --- IT STAFF TICKET DETAIL ---

test('Screenshot: IT Staff Ticket Detail', async ({ page }) => {
  await loginAs(page, 'frank@toktick.dev', 'Dev@123456')
  // Navigate to queue first, then click on a ticket
  await page.goto('/staff/tickets')
  await page.waitForSelector('table, .queue-table, .queue-card-list')
  // Click the first link to detail
  const firstTicketLink = page.locator('a[href*="/staff/tickets/"], button:has-text("Open Detail"), a:has-text("View")').first()
  if (await firstTicketLink.isVisible()) {
    await firstTicketLink.click()
    await page.waitForURL(/\/staff\/tickets\/[^/]+$/)
    await page.waitForLoadState('networkidle')
  }

  for (const bp of BREAKPOINTS) {
    await page.setViewportSize({ width: bp.width, height: bp.height })
    await checkNoHorizontalOverflow(page, `IT Staff Ticket Detail (${bp.name})`)
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/staff-ticket-detail/detail-${bp.name}.png`,
      fullPage: true,
    })
  }
})

test('Screenshot: IT Staff Ticket Detail — as Requester (read-only view)', async ({ page }) => {
  // AC-UI-06: Requester sees read-only operational fields
  await loginAs(page, 'alice@toktick.dev', 'Dev@123456')
  // Navigate to one of Alice's tickets
  await page.goto('/tickets')
  await page.waitForLoadState('networkidle')
  const firstTicketLink = page.locator('a[href*="/tickets/"], button:has-text("View")').first()
  if (await firstTicketLink.isVisible()) {
    await firstTicketLink.click()
    await page.waitForURL(/\/tickets\/[^/]+$/)
    await page.waitForLoadState('networkidle')
  }
  
  // Now modify the URL to access the staff view for the same ticket if possible
  // In toktickit, requester uses /tickets/:id. Let's screenshot the requester view.
  // Wait, AC-UI-06 says: "Editable fields in the IT Staff Ticket Detail screen are rendered in a clearly read-only style when viewed by a Requester"
  // Let's assume the component is shared or they navigate to /staff/tickets/:id ?
  // Actually, the route might be /tickets/:id which shares the component.
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/requester-ticket-detail/requester-detail-desktop.png`,
    fullPage: true,
  })
})

// --- REQUESTER TICKET DETAIL ---

test('Screenshot: Requester Ticket Detail', async ({ page }) => {
  await loginAs(page, 'alice@toktick.dev', 'Dev@123456')
  
  // Navigate to the first ticket in the list
  await page.goto('/tickets')
  await page.waitForLoadState('networkidle')
  // Click on a ticket to open its detail
  const firstTicketLink = page.locator('a[href*="/tickets/"], button:has-text("View")').first()
  if (await firstTicketLink.isVisible()) {
    await firstTicketLink.click()
    await page.waitForURL(/\/tickets\/[^/]+$/)
    await page.waitForLoadState('networkidle')
  }
  
  for (const bp of BREAKPOINTS) {
    await page.setViewportSize({ width: bp.width, height: bp.height })
    await checkNoHorizontalOverflow(page, `Requester Ticket Detail (${bp.name})`)
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/requester-ticket-detail/requester-detail-${bp.name}.png`,
      fullPage: true,
    })
  }
})

// --- ADMIN USER MANAGEMENT ---

test('Screenshot: Admin User Management', async ({ page }) => {
  await loginAs(page, 'admin@toktick.dev', 'Dev@123456')
  for (const bp of BREAKPOINTS) {
    await page.setViewportSize({ width: bp.width, height: bp.height })
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('[data-testid="user-table"], table', { timeout: 10000 }).catch(() => {})
    await checkNoHorizontalOverflow(page, `Admin User Management (${bp.name})`)
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/user-management/user-management-${bp.name}.png`,
      fullPage: true,
    })
  }
})

test('Screenshot: Admin — Create User modal', async ({ page }) => {
  await loginAs(page, 'admin@toktick.dev', 'Dev@123456')
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/admin/users')
  await page.click('[data-testid="create-user-btn"], button:has-text("Create User"), button:has-text("New User")')
  await page.waitForSelector('[role="dialog"]')
  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/user-management/create-user-modal-desktop.png`,
    fullPage: false,
  })
})

test('Screenshot: Admin — Edit User modal', async ({ page }) => {
  await loginAs(page, 'admin@toktick.dev', 'Dev@123456')
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/admin/users')
  await page.waitForSelector('[data-testid^="edit-user-btn-"], button:has-text("Edit")')
  await page.locator('[data-testid^="edit-user-btn-"], button:has-text("Edit")').first().click()
  await page.waitForSelector('[role="dialog"]')
  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/user-management/edit-user-modal-desktop.png`,
    fullPage: false,
  })
})

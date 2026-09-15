import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.fill('#email', 'frank@toktick.dev')
  await page.fill('#password', 'Dev@123456')
  await page.click('button[type="submit"]')
  await page.waitForURL('/staff/tickets')
})

test('IT Staff can view the Ticket Queue and navigate to detail', async ({ page }) => {
  await expect(page.locator('.queue-table, .queue-card-list')).toBeVisible()
  await page.click('button:has-text("Open Detail")')
  await expect(page).toHaveURL(/\/staff\/tickets\//)
})

test('IT Staff can claim ticket ownership', async ({ page }) => {
  await page.goto(`/staff/tickets/${process.env.TEST_TICKET_ID || 1}`)
  await page.click('button:has-text("Claim")')
  await expect(page.getByText(/frank it/i)).toBeVisible()
})

test('IT Staff can set IT Priority', async ({ page }) => {
  await page.goto(`/staff/tickets/${process.env.TEST_TICKET_ID || 1}`)
  await page.selectOption('#it-priority-select', 'CRITICAL')
  await page.click('button:has-text("Save Priority")')
  await expect(page.getByText(/critical/i).first()).toBeVisible()
})

test('IT Staff can perform a valid status transition', async ({ page }) => {
  await page.goto(`/staff/tickets/${process.env.NEW_TICKET_ID || 2}`)
  await page.selectOption('#status-select', 'OPEN')
  await page.click('button:has-text("Update Status")')
  await expect(page.locator('.badge--open')).toBeVisible()
})

test('IT Staff can post an Internal Note', async ({ page }) => {
  await page.goto(`/staff/tickets/${process.env.TEST_TICKET_ID || 1}`)
  await page.fill('textarea[id*="note"]', 'E2E test note — confirmed issue.')
  await page.click('button:has-text("Add Note")')
  await expect(page.getByText('E2E test note — confirmed issue.')).toBeVisible()
})

test('IT Staff can post a Public Comment', async ({ page }) => {
  await page.goto(`/staff/tickets/${process.env.TEST_TICKET_ID || 1}`)
  await page.fill('textarea[id*="comment"]', 'E2E test comment — update for requester.')
  await page.click('button:has-text("Post Comment")')
  await expect(page.getByText('E2E test comment — update for requester.')).toBeVisible()
})

test('"Problem Appears Resolved" indicator is visible when flag is set', async ({ page }) => {
  await page.goto(`/staff/tickets/${process.env.RESOLVED_FLAG_TICKET_ID || 3}`)
  await expect(page.getByText(/requester has indicated.*appears resolved/i)).toBeVisible()
})

test('Attachments are listed and downloadable', async ({ page }) => {
  await page.goto(`/staff/tickets/${process.env.TICKET_WITH_ATTACHMENT_ID || 1}`)
  await expect(page.getByRole('link', { name: /download/i }).first()).toBeVisible()
})

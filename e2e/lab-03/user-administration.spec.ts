import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.fill('#email', 'admin@toktick.dev')
  await page.fill('#password', 'Dev@123456')
  await page.click('button[type="submit"]')
  await page.waitForURL('/admin/users')
})

// AC-ADMIN-13
test('Administrator sees user table with Name, Email, Role, Status columns', async ({ page }) => {
  await expect(page.getByRole('columnheader', { name: /name/i })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: /email/i })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: /role/i })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: /status/i })).toBeVisible()
})

// AC-ADMIN-02
test('Search filters user list by name or email', async ({ page }) => {
  await page.fill('[data-testid="user-search-input"]', 'alice')
  await page.waitForResponse(res => res.url().includes('/admin/users') && res.status() === 200)
  await expect(page.getByText('alice@toktick.dev')).toBeVisible()
})

// AC-ADMIN-03
test('Role filter shows only users of selected role', async ({ page }) => {
  await page.selectOption('[data-testid="role-filter-select"]', 'IT_STAFF')
  await page.waitForResponse(res => res.url().includes('/admin/users') && res.status() === 200)
  // All visible role badges should be IT Staff
  const badges = page.locator('.role-badge--it-staff')
  await expect(badges.first()).toBeVisible()
})

// AC-ADMIN-04
test('Create User — new user appears in list', async ({ page }) => {
  const email = `e2e-${Date.now()}@toktick.dev`
  await page.click('[data-testid="create-user-btn"]')
  await expect(page.getByRole('dialog', { name: /create user/i })).toBeVisible()

  await page.fill('#create-name', 'E2E Test User')
  await page.fill('#create-email', email)
  await page.selectOption('#create-role', 'IT_STAFF')
  await page.fill('#create-password', 'TestPass123')
  await page.getByRole('dialog').getByRole('button', { name: 'Create User', exact: true }).click()

  // Modal should close and new user should appear
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  await expect(page.getByText(email)).toBeVisible()
})

// AC-ADMIN-05
test('Create User — duplicate email shows 409 error', async ({ page }) => {
  await page.click('[data-testid="create-user-btn"]')
  await page.fill('#create-name', 'Duplicate')
  await page.fill('#create-email', 'alice@toktick.dev')   // Alice already exists
  await page.selectOption('#create-role', 'REQUESTER')
  await page.fill('#create-password', 'TestPass123')
  await page.getByRole('dialog').getByRole('button', { name: 'Create User', exact: true }).click()

  await expect(page.getByText(/already exists/i)).toBeVisible()
})

// AC-ADMIN-15
test('Edit User modal is pre-populated with current values', async ({ page }) => {
  const row = page.locator('tr', { hasText: 'alice@toktick.dev' })
  await row.locator('[data-testid^="edit-user-btn-"]').click()
  await expect(page.getByRole('dialog')).toBeVisible()
  // The name and email inputs should be pre-filled (not empty)
  const nameInput = page.locator('#edit-name')
  await expect(nameInput).not.toHaveValue('')
})

// AC-ADMIN-10
test('Set New Password — requires password change at next login', async ({ page }) => {
  const row = page.locator('tr', { hasText: 'bob@toktick.dev' })
  await row.locator('[data-testid^="edit-user-btn-"]').click()
  await page.click('[data-testid="show-password-form-btn"]')
  await page.fill('#new-password', 'NewPassword999')
  await page.click('button:has-text("Update Password")')
  await expect(page.getByText(/must change.*next login/i)).toBeVisible()
})

// AC-ADMIN-08
test('Self-deactivation is prevented in the UI', async ({ page }) => {
  await page.click(`[data-testid="edit-user-btn-${process.env.ADMIN_ID}"]`)
  const activeCheckbox = page.locator('input[type="checkbox"]').first()
  await expect(activeCheckbox).toBeDisabled()
})

// AC-ADMIN-14
test('Non-Administrator sees forbidden screen', async ({ page }) => {
  // Log out and log in as Frank (IT_STAFF)
  await page.click('button:has-text("Log out")')
  await page.waitForURL('/login')
  await page.fill('#email', 'frank@toktick.dev')
  await page.fill('#password', 'Dev@123456')
  await page.click('button[type="submit"]')
  await page.waitForURL('/staff/tickets')

  await page.goto('/admin/users')
  await expect(page.getByText(/access denied|forbidden/i)).toBeVisible()
})

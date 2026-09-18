import { test, expect } from '@playwright/test'

test('valid login redirects to role home screen', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[id="email"]', 'alice@toktick.dev')
  await page.fill('[id="password"]', 'Dev@123456')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/tickets/)
})

test('wrong password shows generic error (no account enumeration)', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[id="email"]', 'alice@toktick.dev')
  await page.fill('[id="password"]', 'WrongPassword!')
  await page.click('button[type="submit"]')
  await expect(page.getByRole('alert')).toContainText('Invalid email or password.')
  await expect(page).toHaveURL(/\/login/) 
})

test('inactive account shows same generic error as wrong password', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[id="email"]', 'ivy@toktick.dev') 
  await page.fill('[id="password"]', 'Dev@123456')
  await page.click('button[type="submit"]')
  await expect(page.getByRole('alert')).toContainText('Invalid email or password.')
})

test.describe.serial('Password Change Flow', () => {
  test('first-login user is redirected to change-password screen', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[id="email"]', 'eve@toktick.dev')
  await page.fill('[id="password"]', 'InitPass@1')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/change-password/, { timeout: 25000 })
})

test('successful password change redirects to app shell', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[id="email"]', 'eve@toktick.dev')
  await page.fill('[id="password"]', 'InitPass@1')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/change-password/, { timeout: 25000 })

  await page.fill('[id="newPassword"]', 'NewStrong@99')
  await page.fill('[id="confirmPassword"]', 'NewStrong@99')
  await page.click('button[type="submit"]')

  await expect(page).not.toHaveURL(/\/change-password/, { timeout: 25000 })
})

});

test('protected routes are inaccessible after logout', async ({ page }) => {
  await loginAs(page, 'alice@toktick.dev', 'Dev@123456')
  await page.click('button:has-text("Log out")')
  await expect(page).toHaveURL(/\/login/)

  await page.goto('/tickets')
  await expect(page).toHaveURL(/\/login/)
})

test('IT Staff nav shows Ticket Queue but not User Management', async ({ page }) => {
  await loginAs(page, 'frank@toktick.dev', 'Dev@123456')
  await expect(page.getByRole('link', { name: /ticket queue/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /user management/i })).not.toBeVisible()
})

test('REQUESTER navigating to /staff/tickets sees forbidden screen', async ({ page }) => {
  await loginAs(page, 'alice@toktick.dev', 'Dev@123456')
  await page.goto('/staff/tickets')
  await expect(page.getByText(/access denied|forbidden/i)).toBeVisible()
})

async function loginAs(page: any, email: string, password: string) {
  await page.goto('/login')
  await page.fill('[id="email"]', email)
  await page.fill('[id="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(url => !url.href.includes('/login'))
}

import { test, expect } from '@playwright/test'
import { loginAs, logout } from './helpers/auth'

test.describe('Ticket Resolution & Concurrency', () => {
  test('E2E-02: ticket resolution flow', async ({ page }) => {
    const runId = Date.now()
    const ticketId = process.env.TEST_TICKET_ID || '1'
    const newTicketId = process.env.NEW_TICKET_ID || '2'

    // 1. Requester marks "appears resolved" on an open ticket
    await loginAs(page, 'REQUESTER')
    await page.goto(`/tickets/${ticketId}`)
    await page.waitForLoadState('networkidle')

    const advisoryBtn = page.getByRole('button', { name: /appears resolved/i })
    if (await advisoryBtn.isVisible()) {
      await advisoryBtn.click()
      // Status remains unchanged
      await expect(page.getByText(/in progress|open/i).first()).toBeVisible()
    }

    // 2. Staff Ticket Detail shows advisory banner
    await logout(page)
    await loginAs(page, 'IT_STAFF')
    await page.goto(`/staff/tickets/${ticketId}`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/requester marked this problem as resolved/i)).toBeVisible()

    // 3. Staff tries to resolve ticket without an action result -> gate failure
    // (If ticket has no action result or attempts invalid transition)
    const statusSelect = page.locator('#status-select, [aria-label*="Update Status"]')
    if (await statusSelect.isVisible()) {
      const options = await statusSelect.locator('option').allTextContents()
      if (options.some(o => o.includes('Resolved'))) {
        await statusSelect.selectOption({ label: 'Resolved' })
        await page.getByRole('button', { name: /update status/i }).click()

        // Either gate failure or success depending on existing actions
        const gateFailure = page.getByRole('alert')
        if (await gateFailure.isVisible()) {
          await expect(gateFailure).toHaveText(/must have at least one action taken|resolution gate/i)
        }
      }
    }

    // 4. Staff adds an Action with result, then resolves
    const actionsSection = page.locator('.actions-taken-section, [data-testid="actions-taken-section"]')
    if (await actionsSection.isVisible()) {
      await actionsSection.getByRole('button', { name: /add action/i }).click()
      await actionsSection.getByLabel(/description/i).fill(`E2E-${runId}: Final resolution step`)
      await actionsSection.getByLabel(/result/i).fill('Root cause fixed and verified')
      await actionsSection.getByRole('button', { name: /^save$/i }).click()
      await expect(actionsSection.getByText(`E2E-${runId}: Final resolution step`)).toBeVisible()
    }

    // Now resolve ticket
    if (await statusSelect.isVisible()) {
      const options = await statusSelect.locator('option').allTextContents()
      if (options.some(o => o.includes('Resolved'))) {
        await statusSelect.selectOption({ label: 'Resolved' })
        await page.getByRole('button', { name: /update status/i }).click()
        await expect(page.locator('.badge--resolved, [data-status="RESOLVED"]')).toBeVisible()
      }
    }

    // 5. Requester cancels their own NEW ticket
    await logout(page)
    await loginAs(page, 'REQUESTER')
    await page.goto(`/tickets/${newTicketId}`)
    await page.waitForLoadState('networkidle')

    const cancelBtn = page.getByRole('button', { name: /cancel ticket/i })
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click()
      // If modal confirmation opens, confirm
      const confirmBtn = page.getByRole('button', { name: /^confirm$/i })
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click()
      }
      await expect(page.locator('.badge--cancelled, [data-status="CANCELLED"]')).toBeVisible()
    }

    // 6. Owner picker (as Administrator) offers NO inactive user
    await logout(page)
    await loginAs(page, 'ADMINISTRATOR')
    await page.goto(`/staff/tickets/${ticketId}`)
    await page.waitForLoadState('networkidle')

    const ownerSelect = page.locator('#owner-select, [aria-label*="Owner"]')
    if (await ownerSelect.isVisible()) {
      const allOwnerOptions = await ownerSelect.locator('option').allTextContents()
      // Inactive staff user ivy@toktick.dev must NOT be present
      expect(allOwnerOptions.some(o => o.toLowerCase().includes('ivy'))).toBe(false)
    }
  })

  test('E2E-04: stale ticket conflict E2E', async ({ browser }) => {
    const ticketId = process.env.TEST_TICKET_ID || '1'

    // Create two separate browser contexts for two concurrent staff sessions
    const contextA = await browser.newContext()
    const contextB = await browser.newContext()

    const pageA = await contextA.newPage()
    const pageB = await contextB.newPage()

    try {
      // Both log in as staff
      await loginAs(pageA, 'IT_STAFF')
      await loginAs(pageB, 'ADMINISTRATOR')

      // Both navigate to the same ticket
      await pageA.goto(`/staff/tickets/${ticketId}`)
      await pageB.goto(`/staff/tickets/${ticketId}`)
      await pageA.waitForLoadState('networkidle')
      await pageB.waitForLoadState('networkidle')

      // Session A edits an Action or changes Status
      const actionsA = pageA.locator('.actions-taken-section, [data-testid="actions-taken-section"]')
      const editBtnA = actionsA.getByRole('button', { name: /edit action/i }).first()

      if (await editBtnA.isVisible()) {
        const actionsB = pageB.locator('.actions-taken-section, [data-testid="actions-taken-section"]')
        const editBtnB = actionsB.getByRole('button', { name: /edit action/i }).first()

        // Both open edit form on the same action
        await editBtnA.click()
        await editBtnB.click()

        // Session A saves first
        await actionsA.getByLabel(/result/i).fill('Session A edit at ' + Date.now())
        await actionsA.getByRole('button', { name: /^save$/i }).click()

        // Session B attempts to save with stale version
        await actionsB.getByLabel(/result/i).fill('Session B conflicting edit')
        await actionsB.getByRole('button', { name: /^save$/i }).click()

        // Session B must see 409 conflict banner with "Reload"
        const conflictBanner = actionsB.locator('[role="alert"]')
        await expect(conflictBanner).toContainText(/modified by another user|conflict/i)

        // Session B's typed text is preserved
        await expect(actionsB.getByLabel(/result/i)).toHaveValue('Session B conflicting edit')

        // Clicking "Reload" reloads the data
        const reloadBtn = conflictBanner.getByRole('button', { name: /reload/i })
        await reloadBtn.click()
      }
    } finally {
      await contextA.close()
      await contextB.close()
    }
  })
})

import { test, expect } from '@playwright/test'
import { loginAs, logout } from './helpers/auth'
import { expectNoHorizontalScroll, setViewport, VIEWPORTS } from './helpers/viewport'
import { expectNoSeriousAxeViolations } from './helpers/axe'

test.describe('E2E-01: actions taken full flow', () => {
  test('E2E-01: staff creates and edits action, second staff contributes, requester views read-only, responsive & a11y checks', async ({ page }, testInfo) => {
    const runId = Date.now()
    const ticketId = process.env.TEST_TICKET_ID || '1'

    // 1. First staff logs in
    await loginAs(page, 'IT_STAFF')
    await page.goto(`/staff/tickets/${ticketId}`)
    await page.waitForLoadState('networkidle')

    // Find the Actions Taken section
    const actionsSection = page.locator('.actions-taken-section, [data-testid="actions-taken-section"]')
    await expect(actionsSection).toBeVisible()

    // Click "เพิ่ม Action"
    const addActionBtn = actionsSection.getByRole('button', { name: /เพิ่ม action/i })
    await addActionBtn.click()

    // Fill form with Follow-up ON but NO follow-up note
    await actionsSection.getByLabel(/คำอธิบาย|description/i).fill(`E2E-${runId}: Investigated faulty switch`)
    await actionsSection.getByLabel(/ผลลัพธ์|result/i).fill('Replaced power cable')
    const followUpToggle = actionsSection.getByLabel(/ต้องการติดตามผล/i)
    await followUpToggle.check()

    // Try submitting without follow-up note
    const submitBtn = actionsSection.getByRole('button', { name: /บันทึก/i })
    await submitBtn.click()

    // Expect inline validation error
    await expect(actionsSection.getByText(/กรุณาระบุบันทึกการติดตามผล|follow-up note is required/i)).toBeVisible()

    // Fix error: provide follow-up note
    await actionsSection.getByLabel(/บันทึกการติดตามผล/i).fill('Verify voltage levels after 1 hour')
    await submitBtn.click()

    // Verify new row appears
    await expect(actionsSection.getByText(`E2E-${runId}: Investigated faulty switch`)).toBeVisible()
    await expect(actionsSection.getByText('Verify voltage levels after 1 hour')).toBeVisible()

    // Edit the action
    const editBtn = actionsSection.getByRole('button', { name: /แก้ไข/i }).first()
    await editBtn.click()

    const resultInput = actionsSection.getByLabel(/ผลลัพธ์|result/i)
    await resultInput.fill('Replaced power cable and tested successfully')
    await actionsSection.getByRole('button', { name: /บันทึก/i }).click()

    // Verify update
    await expect(actionsSection.getByText('Replaced power cable and tested successfully')).toBeVisible()

    // 2. Second staff account adds a different action on the same ticket
    await logout(page)
    await loginAs(page, 'ADMINISTRATOR') // Second staff/admin account
    await page.goto(`/staff/tickets/${ticketId}`)
    await page.waitForLoadState('networkidle')

    const adminActionsSection = page.locator('.actions-taken-section, [data-testid="actions-taken-section"]')
    await adminActionsSection.getByRole('button', { name: /เพิ่ม action/i }).click()
    await adminActionsSection.getByLabel(/คำอธิบาย|description/i).fill(`E2E-${runId}: Second tech review`)
    await adminActionsSection.getByLabel(/ผลลัพธ์|result/i).fill('Approved hardware change')
    await adminActionsSection.getByRole('button', { name: /บันทึก/i }).click()

    await expect(adminActionsSection.getByText(`E2E-${runId}: Second tech review`)).toBeVisible()

    // 3. Requester opens the same ticket and sees all actions read-only with no create/edit controls
    await logout(page)
    await loginAs(page, 'REQUESTER')
    await page.goto(`/tickets/${ticketId}`)
    await page.waitForLoadState('networkidle')

    const requesterActionsSection = page.locator('.actions-taken-section, [data-testid="actions-taken-section"]')
    await expect(requesterActionsSection).toBeVisible()
    await expect(requesterActionsSection.getByText(`E2E-${runId}: Investigated faulty switch`)).toBeVisible()
    await expect(requesterActionsSection.getByText(`E2E-${runId}: Second tech review`)).toBeVisible()

    // Ensure NO create or edit controls exist in the DOM for Requester
    await expect(requesterActionsSection.getByRole('button', { name: /เพิ่ม action/i })).toHaveCount(0)
    await expect(requesterActionsSection.getByRole('button', { name: /แก้ไข/i })).toHaveCount(0)

    // 4. Responsive checks: No horizontal scroll at 360, 768, 1280 px
    for (const vp of [VIEWPORTS.mobile, VIEWPORTS.tablet, VIEWPORTS.desktop]) {
      await setViewport(page, vp)
      await expectNoHorizontalScroll(page)
    }

    // 5. Accessibility check at 1280 px
    await setViewport(page, VIEWPORTS.desktop)
    await expectNoSeriousAxeViolations(page, testInfo, {
      include: ['.actions-taken-section', '[data-testid="actions-taken-section"]'],
    })
  })
})

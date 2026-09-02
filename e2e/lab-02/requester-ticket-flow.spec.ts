import { test, expect } from '@playwright/test';

test.describe('Requester Ticket Flow', () => {
  test('Complete ticket creation and attachment flow', async ({ page }) => {
    // 1. Navigate to the application and select a Development Requester
    await page.goto('/');
    
    // Wait for the requester selection screen to fully load its data from the backend
    await page.waitForLoadState('networkidle');

    // The context selector renders individual buttons for each requester — click the desired one
    await page.getByRole('button', { name: /Alice Johnson/i }).click();

    // After selection the Continue button becomes enabled; wait for it and click
    const continueBtn = page.getByRole('button', { name: /Continue/i });
    await continueBtn.waitFor({ state: 'visible' });
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // 2. Navigate to "Create Ticket"
    await page.getByRole('button', { name: /New Ticket/i }).first().click();

    // Fill out all required fields
    // Using placeholder, label, or generic locators based on typical forms
    const categorySelect = page.getByLabel(/Category/i).or(page.locator('select[name="category"]'));
    if (await categorySelect.count() > 0) {
      await categorySelect.selectOption({ index: 1 });
    }

    const systemSelect = page.getByLabel(/System/i).or(page.locator('select[name="system"]'));
    if (await systemSelect.count() > 0) {
      await systemSelect.selectOption({ index: 1 });
    }

    const prioritySelect = page.getByLabel(/Priority/i).or(page.locator('select[name="priority"]'));
    if (await prioritySelect.count() > 0) {
      await prioritySelect.selectOption({ index: 1 });
    }

    await page.getByLabel(/Summary/i).or(page.locator('input[name="summary"]')).fill('E2E Test Ticket Summary');
    await page.getByLabel(/Description/i).or(page.locator('textarea[name="description"]')).fill('E2E Test Ticket Description with details.');
    
    await page.getByRole('button', { name: /Submit|Create/i }).click();

    // 3. Verify the success state and extract the newly generated Ticket Number
    await expect(page.getByRole('heading', { name: /Ticket Created!/i })).toBeVisible();

    // The ticket number (e.g. TKT-0003) is rendered as a paragraph beneath the heading
    const ticketNumberEl = page.locator('p').filter({ hasText: /TKT-/i }).first();
    const ticketNumber = (await ticketNumberEl.textContent())?.trim() ?? '';

    // 4. Navigate back to the dashboard (which shows My Tickets)
    await page.getByRole('button', { name: /Back to Dashboard/i }).click();
    await page.waitForLoadState('networkidle');

    // Now navigate into the My Tickets view
    await page.getByRole('button', { name: /My Tickets/i }).click();
    await page.waitForLoadState('networkidle');

    // Search or locate the new ticket
    // We search for the summary we just entered
    const searchInput = page.getByPlaceholder(/Search/i).or(page.locator('input[type="search"]'));
    if (await searchInput.count() > 0) {
      await searchInput.fill('E2E Test Ticket Summary');
      await page.keyboard.press('Enter');
    }

    // 5. Click the ticket to open the "Ticket Detail" view
    const ticketLink = page.getByText('E2E Test Ticket Summary').first();
    await ticketLink.click();

    // 6. Upload a valid attachment and verify it appears
    // Step 1: Open the file chooser via the "Choose File" button (not the Upload submit button)
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /Choose File/i }).click();
    const fileChooser = await fileChooserPromise;

    // Step 2: Set the file to upload — must be a valid PDF (magic bytes) to pass backend validation
    const dummyContent = Buffer.from('%PDF-1.4\n%EOF\n');
    await fileChooser.setFiles({
      name: 'test-attachment.pdf',
      mimeType: 'application/pdf',
      buffer: dummyContent,
    });

    // Step 3: Click the Upload submit button (separate from Choose File, starts disabled)
    const uploadBtn = page.getByRole('button', { name: /^Upload$/i });
    await expect(uploadBtn).toBeEnabled();
    await uploadBtn.click();
    await page.waitForLoadState('networkidle');

    // Verify it appears in the active attachments list
    await expect(page.getByText('test-attachment.pdf')).toBeVisible();

    // 7. Soft-remove the attachment and verify it is removed from the UI

    // Auto-accept native window.confirm dialog if it appears
    page.once('dialog', dialog => dialog.accept());

    const removeBtn = page.getByRole('button', { name: /Remove/i }).first();
    await removeBtn.click();

    // If it's a DOM modal, wait for the confirm button to appear and click it.
    // Wrapped in try-catch so it doesn't fail when the native dialog handled it instead.
    const confirmBtn = page.getByRole('button', { name: /Confirm|Yes|Delete/i }).filter({ hasNotText: 'Remove' });
    try {
      await confirmBtn.waitFor({ state: 'visible', timeout: 3000 });
      await confirmBtn.click();
    } catch (e) {
      // No DOM modal found — already handled by native dialog listener above
    }

    // Wait for the backend deletion request to finish before asserting
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('test-attachment.pdf')).not.toBeVisible();
  });
});

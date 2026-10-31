import { test, expect } from '@playwright/test';
import { VIEWPORT_LIST, setViewport, expectNoHorizontalScroll } from './helpers/viewport';
import { expectNoSeriousAxeViolations } from './helpers/axe';
import { loginAs } from './helpers/auth';

test.describe('E2E Helper Self-Checks', () => {
  
  test('HELPER-06: viewport helper handles scroll detection', async ({ page }) => {
    // Passes on existing login page
    for (const vp of VIEWPORT_LIST) {
      await setViewport(page, vp);
      await page.goto('/login');
      await expectNoHorizontalScroll(page);
    }
    
    // Fails on explicitly wide content
    await setViewport(page, VIEWPORT_LIST[0]);
    await page.setContent(`
      <div style="width: 2000px; height: 100px; background: red;">Wide</div>
    `);
    
    await expect(expectNoHorizontalScroll(page)).rejects.toThrow(/Horizontal scroll detected/);
  });

  test('HELPER-07: axe helper detects serious violations', async ({ page }, testInfo) => {
    // Use a clean page that passes for the baseline to avoid flakiness if the real login page has issues
    await page.setContent(`
      <html lang="en">
        <head><title>Clean Page</title></head>
        <body><main><h1>Accessible</h1></main></body>
      </html>
    `);
    await expectNoSeriousAxeViolations(page, testInfo);

    // Ensure it detects violations
    await page.setContent(`
      <html lang="en">
        <head><title>Bad Page</title></head>
        <body>
          <img src="fake.png" />
          <input type="text" />
        </body>
      </html>
    `);
    await expect(expectNoSeriousAxeViolations(page, testInfo)).rejects.toThrow(/Accessibility violations found/);
  });

  test('HELPER-08: loginAs works for seeded roles', async ({ page }) => {
    await loginAs(page, 'REQUESTER');
    // Requester goes to /tickets or somewhere not /login
    expect(page.url()).not.toContain('/login');
    
    await page.context().clearCookies();
    
    await loginAs(page, 'IT_STAFF');
    expect(page.url()).not.toContain('/login');
  });

});

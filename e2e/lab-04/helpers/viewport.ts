import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export const VIEWPORTS = {
  mobile: { name: "mobile", width: 360, height: 800 },
  tablet: { name: "tablet", width: 768, height: 1024 },
  desktop: { name: "desktop", width: 1280, height: 800 }
};

export const VIEWPORT_LIST = [VIEWPORTS.mobile, VIEWPORTS.tablet, VIEWPORTS.desktop];

export async function setViewport(page: Page, viewport: { width: number, height: number }) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
}

export function forEachViewport(callback: (viewport: typeof VIEWPORTS.mobile) => void) {
  for (const viewport of VIEWPORT_LIST) {
    callback(viewport);
  }
}

export async function expectNoHorizontalScroll(page: Page) {
  const result = await page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth;
    const bodyWidth = document.body.scrollWidth;
    const clientWidth = document.documentElement.clientWidth;
    
    if (docWidth > clientWidth + 1 || bodyWidth > clientWidth + 1) {
      // Find offending elements
      const offenders: string[] = [];
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        const bounds = el.getBoundingClientRect();
        if (bounds.right > clientWidth + 1) {
          let identifier = el.tagName.toLowerCase();
          if (el.id) identifier += `#${el.id}`;
          else if (el.className && typeof el.className === 'string') {
            identifier += `.${el.className.split(' ').join('.')}`;
          }
          offenders.push(`${identifier} (width: ${bounds.width}px, right: ${bounds.right}px)`);
          if (offenders.length >= 5) break; // limit output
        }
      }
      return { hasScroll: true, clientWidth, docWidth, offenders };
    }
    return { hasScroll: false };
  });

  if (result.hasScroll) {
    throw new Error(`Horizontal scroll detected! Client width: ${result.clientWidth}px, Scroll width: ${result.docWidth}px.\nWidest offending elements:\n${result.offenders?.join('\n')}`);
  }
}

export async function findClippedControls(page: Page) {
  return await page.evaluate(() => {
    const clientWidth = document.documentElement.clientWidth;
    const selectors = 'a, button, input, select, textarea, [role="button"]';
    const controls = document.querySelectorAll(selectors);
    const clipped: string[] = [];
    
    for (const el of controls) {
      const bounds = el.getBoundingClientRect();
      if (bounds.right > clientWidth + 1 || bounds.left < -1) {
        let identifier = el.tagName.toLowerCase();
        if (el.id) identifier += `#${el.id}`;
        clipped.push(identifier);
      }
    }
    return clipped;
  });
}

export async function captureViewportScreenshot(page: Page, name: string, viewport: typeof VIEWPORTS.mobile) {
  if (process.env.CAPTURE_SCREENSHOTS !== '1') return;
  
  const dir = path.join(process.cwd(), 'artifacts/lab-04/screenshots', name.split('/')[0] || 'misc');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  const filename = `${name.replace(/\//g, '-')}-${viewport.name}-${viewport.width}.png`;
  await page.screenshot({ path: path.join(dir, filename) });
}

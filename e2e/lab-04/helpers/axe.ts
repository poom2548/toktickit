import { Page, TestInfo, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export interface AxeOptions {
  include?: string[];
  exclude?: string[];
  disabledRules?: { id: string; reason: string }[];
}

export async function runAxe(page: Page, options?: AxeOptions) {
  let builder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);

  if (options?.include && options.include.length > 0) {
    builder = builder.include(options.include);
  }
  
  if (options?.exclude && options.exclude.length > 0) {
    builder = builder.exclude(options.exclude);
  }
  
  if (options?.disabledRules && options.disabledRules.length > 0) {
    // Documented way to disable specific rules with a mandatory written reason
    for (const rule of options.disabledRules) {
      if (!rule.reason || rule.reason.trim() === '') {
        throw new Error(`Rule ${rule.id} disabled without a mandatory written reason.`);
      }
    }
    const ruleIds = options.disabledRules.map(r => r.id);
    builder = builder.disableRules(ruleIds);
  }

  return await builder.analyze();
}

export async function attachAxeResults(testInfo: TestInfo, results: any, name = 'accessibility-scan-results') {
  await testInfo.attach(name, {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json'
  });
}

export async function expectNoSeriousAxeViolations(page: Page, testInfo: TestInfo, options?: AxeOptions) {
  const results = await runAxe(page, options);
  
  // Attach the full report
  await attachAxeResults(testInfo, results);
  
  const seriousOrCritical = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
  const minorOrModerate = results.violations.filter(v => v.impact === 'minor' || v.impact === 'moderate');
  
  // Log minor/moderate as warnings
  for (const v of minorOrModerate) {
    console.warn(`[AXE WARNING] Rule: ${v.id} (${v.impact})\nHelp: ${v.help}\nNodes: ${v.nodes.length}\nHelp URL: ${v.helpUrl}`);
  }
  
  if (seriousOrCritical.length > 0) {
    let errorMessage = `Accessibility violations found:\n\n`;
    for (const v of seriousOrCritical) {
      errorMessage += `Rule ID: ${v.id}\n`;
      errorMessage += `Impact: ${v.impact}\n`;
      errorMessage += `Help: ${v.help}\n`;
      errorMessage += `Nodes affected: ${v.nodes.length}\n`;
      errorMessage += `Help URL: ${v.helpUrl}\n`;
      
      const targets = v.nodes.slice(0, 3).map(n => n.target.join(', ')).join('\n  - ');
      errorMessage += `First targets:\n  - ${targets}\n\n`;
    }
    throw new Error(errorMessage);
  }
}

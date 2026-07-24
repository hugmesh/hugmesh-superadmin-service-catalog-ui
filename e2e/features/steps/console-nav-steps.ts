// Console shell navigation — click a menubar item (roving-tabindex nav in
// service-catalog-console.component.html, data-testid="service-catalog-nav-<view>")
// and wait for the child route to activate. Used by the cross-view journeys
// (profiles -> deployments dropdown, record -> provision -> end).

import { When } from '../support/fixtures';

When('the superadmin opens the {string} view', async ({ page }, view: string) => {
  await page.locator(`[data-testid="service-catalog-nav-${view}"]`).click();
  await page.waitForURL((url) => url.pathname.endsWith(`/service-catalog/${view}`), { timeout: 15_000 });
});

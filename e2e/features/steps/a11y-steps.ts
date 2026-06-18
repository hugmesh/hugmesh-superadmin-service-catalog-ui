// Accessibility step definitions for the SUPERADMIN-only surfaces. Grounded
// against the role/aria contract in appstore-console.component.html (menubar +
// menuitem + roving tabindex), appstore-add-service.component.html (labelled
// fields, aria-describedby helptext on the disabled Provision button + source
// blurbs), and appstore-forbidden.component.html (role="alert").

import { expect } from '@playwright/test';
import { Then } from '../support/fixtures';

Then('the console nav has role {string}', async ({ page }, role: string) => {
  await expect(page.locator(`nav.appstore-nav[role="${role}"]`)).toBeVisible({ timeout: 10_000 });
});

Then('the console nav has an accessible name', async ({ page }) => {
  const nav = page.locator('nav.appstore-nav');
  const label = await nav.getAttribute('aria-label');
  expect((label ?? '').trim().length).toBeGreaterThan(0);
});

Then('every console nav item has role {string}', async ({ page }, role: string) => {
  const items = page.locator('a.appstore-nav__item');
  const count = await items.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(items.nth(i)).toHaveAttribute('role', role);
  }
});

Then('every console nav item has an accessible name', async ({ page }) => {
  const items = page.locator('a.appstore-nav__item');
  const count = await items.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const item = items.nth(i);
    const aria = (await item.getAttribute('aria-label')) ?? '';
    const text = (await item.innerText()) ?? '';
    expect((aria.trim() || text.trim()).length).toBeGreaterThan(0);
  }
});

Then('the add view has a heading {string}', async ({ page }, heading: string) => {
  await expect(page.getByRole('heading', { name: new RegExp(heading, 'i') })).toBeVisible({ timeout: 10_000 });
});

Then('the domain field has an associated label', async ({ page }) => {
  const input = page.locator('#appstore-add-domain');
  await expect(input).toBeVisible({ timeout: 10_000 });
  // The <label for="appstore-add-domain"> binds the accessible name.
  await expect(page.locator('label[for="appstore-add-domain"]')).toHaveCount(1);
  // And the help text is wired via aria-describedby.
  await expect(input).toHaveAttribute('aria-describedby', 'appstore-add-domain-help');
});

Then('the Provision button is described by helptext', async ({ page }) => {
  const btn = page.locator('button[type="submit"]:has-text("Provision service")');
  const describedBy = await btn.getAttribute('aria-describedby');
  expect(describedBy).toBe('appstore-provision-help');
  await expect(page.locator(`#${describedBy}`)).toContainText(/repository URL|source/i);
});

Then('each source option has a describing blurb', async ({ page }) => {
  for (const kind of ['SELECT', 'GIT', 'DOCKERFILE', 'ZIP']) {
    const radio = page.locator(`[data-testid="appstore-source-${kind}"] input[type="radio"]`);
    const describedBy = await radio.getAttribute('aria-describedby');
    expect(describedBy).toBe(`appstore-source-blurb-${kind}`);
    await expect(page.locator(`#appstore-source-blurb-${kind}`)).not.toBeEmpty();
  }
});

Then('the forbidden screen has role {string}', async ({ page }, role: string) => {
  await expect(page.locator(`section.appstore-forbidden[role="${role}"]`)).toBeVisible({ timeout: 10_000 });
});

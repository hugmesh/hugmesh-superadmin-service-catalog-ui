// Step definitions for the superadminGuard ALLOW/DENY matrix + cross-tenant
// isolation. These wrap the helpers in tests/helpers/roles.ts so the BDD surface
// stays a thin presentation layer over deterministic session seeding.

import { expect } from '@playwright/test';
import { Given, Then } from '../support/fixtures';
import {
  loginAs,
  expectForbidden,
  sessionRoles,
  SeedUser,
  SERVICE_CATALOG_FORBIDDEN_PATH,
} from '../../tests/helpers/roles';
import { pageRegistry } from './_registry';

Given('{string} opens the service-catalog at {string}', async ({ page, user }, username: string, route: string) => {
  const u: SeedUser = user(username);
  await loginAs(page, u, route);
  pageRegistry.set(u.username, page);
});

Then('the service-catalog console nav is visible', async ({ page }) => {
  await expect(page.locator('nav.service-catalog-nav[role="menubar"]')).toBeVisible({ timeout: 15_000 });
});

Then('the service-catalog console nav is not visible', async ({ page }) => {
  await expect(page.locator('nav.service-catalog-nav[role="menubar"]')).toHaveCount(0);
});

Then('the {string} view is shown', async ({ page }, view: string) => {
  // Each view's first panel carries a stable data-testid or heading id; the URL
  // ending in the view slug is the load-bearing signal the guard let us through.
  await page.waitForURL((url) => url.pathname.endsWith(`/service-catalog/${view}`), { timeout: 15_000 });
  await expect(page.locator('.service-catalog-head h1')).toHaveText(/Superadmin Service Catalog/i, { timeout: 10_000 });
});

Then('the service-catalog forbidden screen is not shown', async ({ page }) => {
  await expect(page).not.toHaveURL(new RegExp(`${SERVICE_CATALOG_FORBIDDEN_PATH}$`));
});

Then('the service-catalog forbidden screen is shown at {string}', async ({ page }, path: string) => {
  await page.waitForURL((url) => url.pathname.endsWith(path), { timeout: 20_000 });
  await expectForbidden(page);
});

Then('the read-only own-domain catalog section is shown', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: /your domain.s offered catalog/i }),
  ).toBeVisible({ timeout: 10_000 });
});

Then('the read-only own-domain catalog section is not shown', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /your domain.s offered catalog/i })).toHaveCount(0);
});

Then('the loaded domain is {string}', async ({ page }, domain: string) => {
  await expect(page.getByRole('heading', { name: new RegExp(`Recorded services for ${domain}`, 'i') }))
    .toBeVisible({ timeout: 10_000 });
});

Then('the {string} rows are not shown', async ({ page }, needle: string) => {
  await expect(page.locator('[data-testid="service-catalog-add-list"]')).not.toContainText(needle);
});

Then('the session domain is {string}', async ({ page }, domain: string) => {
  const roles = await sessionRoles(page);
  // The session is present (roles seeded) and its identity carries the domain —
  // a cheap guard against a storage-partition regression dropping the session.
  expect(roles.length).toBeGreaterThan(0);
  const id = await page.evaluate(() => {
    const raw = window.localStorage.getItem('snap.session');
    return raw ? (JSON.parse(raw) as { id?: string }).id ?? '' : '';
  });
  expect(id).toContain(domain);
});

// App-profiles CRUD + the profile -> deployments profileRef dropdown data flow.
// Grounded against service-catalog-profiles.component.html:
//   #service-catalog-profile-name, the "Create profile" submit,
//   [data-testid="service-catalog-profiles-notice"] / -list / -form-error,
//   the per-row "Delete profile <name>" button; and
// service-catalog-deployments.component.html #service-catalog-record-profile
//   (options fed by GET /bff/superadmin/app-profiles on domain load).
//
// Single-user, default page — every scenario is the superadmin operating their own
// global template library under a real Casdoor session. @cluster.

import { expect } from '@playwright/test';
import { When, Then } from '../support/fixtures';

const PROFILE_FORM = 'form.service-catalog-profile-form';
const LIST = '[data-testid="service-catalog-profiles-list"]';

When('the superadmin creates the app profile {string}', async ({ page }, name: string) => {
  await page.locator('#service-catalog-profile-name').fill(name);
  await page.locator(`${PROFILE_FORM} button[type="submit"]`).click();
  await expect(page.locator('[data-testid="service-catalog-profiles-notice"]')).toContainText(
    new RegExp(`Created profile .*${name}`, 'i'),
    { timeout: 15_000 },
  );
});

When('the superadmin creates the app profile {string} a second time', async ({ page }, name: string) => {
  await page.locator('#service-catalog-profile-name').fill(name);
  await page.locator(`${PROFILE_FORM} button[type="submit"]`).click();
});

Then('the duplicate-name conflict message is shown', async ({ page }) => {
  await expect(page.locator('[data-testid="service-catalog-profiles-form-error"]')).toContainText(
    /already exists/i,
    { timeout: 15_000 },
  );
});

Then('the app profile {string} is listed', async ({ page }, name: string) => {
  await expect(page.locator(`${LIST} .service-catalog-row__key`, { hasText: name })).toHaveCount(1, {
    timeout: 15_000,
  });
});

Then('the app profile {string} is not listed', async ({ page }, name: string) => {
  await expect(page.locator(`${LIST} .service-catalog-row__key`, { hasText: name })).toHaveCount(0, {
    timeout: 15_000,
  });
});

When('the superadmin deletes the app profile {string}', async ({ page }, name: string) => {
  await page.getByRole('button', { name: new RegExp(`Delete profile ${name}`, 'i') }).click();
  await expect(page.locator('[data-testid="service-catalog-profiles-notice"]')).toContainText(
    new RegExp(`Deleted profile .*${name}`, 'i'),
    { timeout: 15_000 },
  );
});

// ── cross-view: the profile feeds the Deployments profileRef dropdown ──

Then('the deployments profile dropdown for {string} offers {string}', async ({ page }, domain: string, name: string) => {
  await page.locator('[data-testid="service-catalog-nav-deployments"]').click();
  await page.waitForURL((url) => url.pathname.endsWith('/service-catalog/deployments'), { timeout: 15_000 });
  await page.locator('#service-catalog-deployments-domain').fill(domain);
  await page.locator('form.service-catalog-domain-form button[type="submit"]').click();
  await expect(
    page.getByRole('heading', { name: new RegExp(`Record a deployment in ${domain}`, 'i') }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#service-catalog-record-profile option', { hasText: name })).toHaveCount(1, {
    timeout: 15_000,
  });
});

Then('the deployments profile dropdown for {string} does not offer {string}', async ({ page }, domain: string, name: string) => {
  await page.locator('[data-testid="service-catalog-nav-deployments"]').click();
  await page.waitForURL((url) => url.pathname.endsWith('/service-catalog/deployments'), { timeout: 15_000 });
  await page.locator('#service-catalog-deployments-domain').fill(domain);
  await page.locator('form.service-catalog-domain-form button[type="submit"]').click();
  await expect(
    page.getByRole('heading', { name: new RegExp(`Record a deployment in ${domain}`, 'i') }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#service-catalog-record-profile option', { hasText: name })).toHaveCount(0, {
    timeout: 15_000,
  });
});

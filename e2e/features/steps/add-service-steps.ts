// Step definitions for the four-source add-a-service flow + cross-tenant
// re-scope. Selectors are grounded against
// src/app/appstore-add-service.component.html (the data-testid + id contract):
//
//   #appstore-add-domain        — the domain text input
//   [data-testid="appstore-add-dark-note"]  — the ships-dark effector note
//   [data-testid="appstore-add-list"]       — the recorded-deployments table
//   [data-testid="appstore-source-<KIND>"]  — each of the four source <label>s
//   #appstore-source-repo / -path / -rev    — the repo coordinate inputs
//   [data-testid="appstore-add-notice"]     — the provision success notice
//   [data-testid="appstore-source-gated-badge"]  — the "needs builder" badge

import { expect } from '@playwright/test';
import { Given, When, Then } from '../support/fixtures';

const PROVISION_BTN = 'button[type="submit"]:has-text("Provision service")';

Given('the domain {string} is loaded with recorded deployments', async ({ page }, domain: string) => {
  const input = page.locator('#appstore-add-domain');
  await input.waitFor({ state: 'visible', timeout: 15_000 });
  await input.fill(domain);
  await page.locator('form.appstore-domain-form button[type="submit"]').click();
  // Either the table or the empty-state renders once the GET settles. The table
  // is the expected path on a seeded cluster; assert the loaded-domain heading
  // so we don't race the row render.
  await expect(page.getByRole('heading', { name: new RegExp(`Recorded services for ${domain}`, 'i') }))
    .toBeVisible({ timeout: 15_000 });
});

When('the superadmin chooses the first recorded deployment', async ({ page }) => {
  const firstChoose = page.locator('[data-testid="appstore-add-list"] tbody tr button').first();
  await firstChoose.waitFor({ state: 'visible', timeout: 10_000 });
  await firstChoose.click();
  // The source form section appears once a row is selected.
  await expect(page.locator('fieldset.appstore-sources')).toBeVisible({ timeout: 10_000 });
});

When('the superadmin picks the {string} source', async ({ page }, kind: string) => {
  const radio = page.locator(`[data-testid="appstore-source-${kind}"] input[type="radio"]`);
  await radio.check();
});

When('the superadmin enters the repository URL {string}', async ({ page }, url: string) => {
  await page.locator('#appstore-source-repo').fill(url);
});

When('the superadmin enters the repo path {string}', async ({ page }, path: string) => {
  await page.locator('#appstore-source-path').fill(path);
});

When('the superadmin enters the target revision {string}', async ({ page }, rev: string) => {
  await page.locator('#appstore-source-rev').fill(rev);
});

When('the superadmin provisions the service', async ({ page }) => {
  await page.locator(PROVISION_BTN).click();
});

Then('the ships-dark effector note is shown', async ({ page }) => {
  await expect(page.locator('[data-testid="appstore-add-dark-note"]')).toBeVisible({ timeout: 10_000 });
});

Then('a provision success notice is shown', async ({ page }) => {
  await expect(page.locator('[data-testid="appstore-add-notice"]')).toBeVisible({ timeout: 15_000 });
});

Then('the deployment list reflects the applied propagation state', async ({ page }) => {
  await expect(page.locator('[data-testid="appstore-add-list"]')).toContainText(/applied/i, {
    timeout: 15_000,
  });
});

Then('the {string} source option is disabled and badged {string}', async ({ page }, kind: string, badge: string) => {
  const radio = page.locator(`[data-testid="appstore-source-${kind}"] input[type="radio"]`);
  await expect(radio).toBeDisabled();
  await expect(page.locator(`[data-testid="appstore-source-${kind}"]`)).toContainText(badge);
});

Then('the Provision button is disabled until a live source and repo URL are chosen', async ({ page }) => {
  await expect(page.locator(PROVISION_BTN)).toBeDisabled();
});

Then('the Provision button is enabled', async ({ page }) => {
  await expect(page.locator(PROVISION_BTN)).toBeEnabled({ timeout: 10_000 });
});

// ── cross-tenant isolation ──

Then('no recorded deployment is selected', async ({ page }) => {
  // A selected row carries aria-pressed="true" / the "Chosen" label; none should.
  await expect(page.locator('[data-testid="appstore-add-list"] button[aria-pressed="true"]')).toHaveCount(0);
});

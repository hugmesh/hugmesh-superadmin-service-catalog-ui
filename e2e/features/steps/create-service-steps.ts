// Step definitions for the create-and-federate wizard walk. Selectors are grounded
// against src/app/service-catalog-create-service.component.html (the data-testid + id
// contract):
//
//   [data-testid="service-catalog-create-step-rail"]      — the visual step rail
//   [data-testid="service-catalog-create-dark-intro"]     — the ships-dark intro note
//   [data-testid="service-catalog-create-step-<view>"]    — each step's panel
//   #service-catalog-create-domain / -servicekey          — the identity inputs
//   [data-testid="service-catalog-create-next"] / -back    — the wizard nav
//   [data-testid="service-catalog-create-archetype-<name>"] input[type=radio]
//   [data-testid="service-catalog-create-source-<KIND>"]  input[type=radio]
//   #service-catalog-create-repo                          — the source repo URL
//   [data-testid="service-catalog-create-apply"]          — the Apply button
//   [data-testid="service-catalog-create-apply-steps"]    — the per-step result list
//   [data-testid="service-catalog-create-dark-note"]      — the federation dark note
//   [data-testid="service-catalog-create-stepup"]         — the step-up challenge dialog
//   [data-testid="service-catalog-create-archetype-slug-error"] — the slug-rule error

import { expect } from '@playwright/test';
import { When, Then } from '../support/fixtures';

const NEXT_BTN = '[data-testid="service-catalog-create-next"]';

Then('the create wizard step rail is shown', async ({ page }) => {
  await expect(page.locator('[data-testid="service-catalog-create-step-rail"]')).toBeVisible({ timeout: 15_000 });
});

Then('the create ships-dark intro note is shown', async ({ page }) => {
  await expect(page.locator('[data-testid="service-catalog-create-dark-intro"]')).toBeVisible({ timeout: 10_000 });
});

Then('the {string} create wizard step is shown', async ({ page }, view: string) => {
  await expect(page.locator(`[data-testid="service-catalog-create-step-${view}"]`)).toBeVisible({ timeout: 10_000 });
});

When('the operator enters the service identity {string} and key {string}', async ({ page }, domain: string, key: string) => {
  await page.locator('#service-catalog-create-domain').fill(domain);
  await page.locator('#service-catalog-create-servicekey').fill(key);
});

When('the operator advances the create wizard', async ({ page }) => {
  await page.locator(NEXT_BTN).click();
});

When('the operator picks the {string} create archetype', async ({ page }, name: string) => {
  await page.locator(`[data-testid="service-catalog-create-archetype-${name}"] input[type="radio"]`).check();
});

When('the operator picks the {string} create source', async ({ page }, kind: string) => {
  await page.locator(`[data-testid="service-catalog-create-source-${kind}"] input[type="radio"]`).check();
});

When('the operator enters the create repository URL {string}', async ({ page }, url: string) => {
  await page.locator('#service-catalog-create-repo').fill(url);
});

When('the operator applies the create chain', async ({ page }) => {
  await page.locator('[data-testid="service-catalog-create-apply"]').click();
});

Then('the create apply steps are shown', async ({ page }) => {
  await expect(page.locator('[data-testid="service-catalog-create-apply-steps"]')).toBeVisible({ timeout: 15_000 });
});

Then('the federation dark-note is shown', async ({ page }) => {
  await expect(page.locator('[data-testid="service-catalog-create-dark-note"]')).toBeVisible({ timeout: 15_000 });
});

Then('the create {string} source option is disabled and badged {string}', async ({ page }, kind: string, badge: string) => {
  const radio = page.locator(`[data-testid="service-catalog-create-source-${kind}"] input[type="radio"]`);
  await expect(radio).toBeDisabled();
  await expect(page.locator(`[data-testid="service-catalog-create-source-${kind}"]`)).toContainText(badge);
});

Then('the archetype slug rule error is shown', async ({ page }) => {
  await expect(page.locator('[data-testid="service-catalog-create-archetype-slug-error"]')).toBeVisible({ timeout: 10_000 });
});

Then('advancing the create wizard is blocked on the archetype step', async ({ page }) => {
  await page.locator(NEXT_BTN).click();
  await expect(page.locator('[data-testid="service-catalog-create-step-archetype"]')).toBeVisible();
});

Then('the create step-up challenge is shown', async ({ page }) => {
  await expect(page.locator('[data-testid="service-catalog-create-stepup"]')).toBeVisible({ timeout: 15_000 });
});

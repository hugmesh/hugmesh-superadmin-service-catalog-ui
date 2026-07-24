// Deployments (lifecycle accounting) view — record / end / list, plus the
// two-superadmin concurrent-mutation matrix. Grounded against
// service-catalog-deployments.component.html:
//   #service-catalog-deployments-domain, the "Load deployments" submit,
//   #service-catalog-record-key / -profile / -ending, "Record deployment",
//   [data-testid="service-catalog-deployments-notice"] / -list, and the per-row
//   "End" button (aria-label "End the deployment of <serviceKey>").
//
// The step logic lives in Page-taking helpers so the single-user lifecycle journey
// (default page) and the two-user concurrent scenario (pageForUser) share ONE
// implementation. All are @cluster (real Casdoor sessions — the reads + writes
// carry the bff_ cookie).

import { expect, Page } from '@playwright/test';
import { When, Then } from '../support/fixtures';
import { pageForUser } from './_registry';

const LIST = '[data-testid="service-catalog-deployments-list"]';
// A fixed far-future expiry so the endingAt clock is a valid, permanent-ish instant.
const EXPIRY_LOCAL = '2035-01-01T00:00';

async function loadDeployments(page: Page, domain: string): Promise<void> {
  const input = page.locator('#service-catalog-deployments-domain');
  await input.waitFor({ state: 'visible', timeout: 15_000 });
  await input.fill(domain);
  await page.locator('form.service-catalog-domain-form button[type="submit"]').click();
  await expect(
    page.getByRole('heading', { name: new RegExp(`Record a deployment in ${domain}`, 'i') }),
  ).toBeVisible({ timeout: 15_000 });
}

async function recordDeployment(
  page: Page,
  serviceKey: string,
  opts: { profile?: string; expiry?: boolean } = {},
): Promise<void> {
  await page.locator('#service-catalog-record-key').fill(serviceKey);
  if (opts.profile) {
    await page.locator('#service-catalog-record-profile').selectOption(opts.profile);
  }
  if (opts.expiry) {
    await page.locator('#service-catalog-record-ending').fill(EXPIRY_LOCAL);
  }
  await page.locator('form.service-catalog-record-form button[type="submit"]').click();
  await expect(page.locator('[data-testid="service-catalog-deployments-notice"]')).toContainText(
    new RegExp(`Recorded a deployment of .*${serviceKey}`, 'i'),
    { timeout: 15_000 },
  );
}

async function endDeployment(page: Page, serviceKey: string): Promise<void> {
  await page
    .getByRole('button', { name: new RegExp(`End the deployment of ${serviceKey}`, 'i') })
    .first()
    .click();
  await expect(page.locator('[data-testid="service-catalog-deployments-notice"]')).toContainText(
    new RegExp(`Ended the deployment of .*${serviceKey}`, 'i'),
    { timeout: 15_000 },
  );
}

/** Assert an accounting row for `serviceKey` is in `state` (active|ended). Scopes to
 *  the row that carries the service key, then requires the state text inside it —
 *  not a page-wide substring, so it is a real per-row assertion. */
async function assertRowState(page: Page, serviceKey: string, state: string): Promise<void> {
  const rows = page.locator(`${LIST} tbody tr`).filter({ hasText: serviceKey });
  await expect(rows.filter({ hasText: state }).first()).toBeVisible({ timeout: 15_000 });
}

// ── single-user (lifecycle journey) — default page ──

When('the superadmin loads the deployments for {string}', async ({ page }, domain: string) => {
  await loadDeployments(page, domain);
});

When('the superadmin records the service {string} with the {string} profile and an expiry', async ({ page }, serviceKey: string, profile: string) => {
  await recordDeployment(page, serviceKey, { profile, expiry: true });
});

When('the superadmin ends the {string} deployment', async ({ page }, serviceKey: string) => {
  await endDeployment(page, serviceKey);
});

Then('the deployments accounting shows {string} as {string}', async ({ page }, serviceKey: string, state: string) => {
  await assertRowState(page, serviceKey, state);
});

Then('the deployments accounting row for {string} shows propagation {string}', async ({ page }, serviceKey: string, propagation: string) => {
  const rows = page.locator(`${LIST} tbody tr`).filter({ hasText: serviceKey });
  await expect(rows.filter({ hasText: propagation }).first()).toBeVisible({ timeout: 15_000 });
});

// ── two-superadmin concurrent mutation — username-keyed ──

When('{string} loads the deployments for {string}', async ({}, username: string, domain: string) => {
  await loadDeployments(pageForUser(username), domain);
});

When('{string} reloads the deployments for {string}', async ({}, username: string, domain: string) => {
  await loadDeployments(pageForUser(username), domain);
});

When('{string} records the service {string} in {string}', async ({}, username: string, serviceKey: string, _domain: string) => {
  // _domain is the already-loaded domain (a readability anchor in the feature); the
  // record posts to whatever domain this user's view has loaded.
  await recordDeployment(pageForUser(username), serviceKey);
});

When('{string} ends the {string} deployment in {string}', async ({}, username: string, serviceKey: string, _domain: string) => {
  await endDeployment(pageForUser(username), serviceKey);
});

Then('{string} sees the {string} deployment as {string}', async ({}, username: string, serviceKey: string, state: string) => {
  await assertRowState(pageForUser(username), serviceKey, state);
});

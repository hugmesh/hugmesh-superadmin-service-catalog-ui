// Curation view + the two-tier cross-user visibility matrix. Grounded against:
//   service-catalog-curation.component.html — #service-catalog-curation-domain,
//     #service-catalog-curation-key, the Offer/Withdraw buttons,
//     [data-testid="service-catalog-curation-notice"] / -list.
//   service-catalog-forbidden.component.html — the ADMIN two-tier read-only degrade
//     [data-testid="service-catalog-mycatalog-list"] / -empty (GET /bff/admin/service-store,
//     domain resolved server-side from the JWT issuer — a brand admin sees ONLY
//     their own domain's offered rows; a superadmin offered it FIRST = victim-creates-first).
//
// All steps are username-keyed (pageForUser) because this is the flagship
// two-user propagation: a superadmin offers on context 1, a brand admin reads the
// result on context 2. Real Casdoor sessions on both (the writes/reads need the
// bff_ cookie).

import { expect } from '@playwright/test';
import { When, Then } from '../support/fixtures';
import { pageForUser } from './_registry';

const OFFER_FORM = 'form.service-catalog-offer-form';

When('{string} loads the curation catalog for {string}', async ({}, username: string, domain: string) => {
  const page = pageForUser(username);
  const input = page.locator('#service-catalog-curation-domain');
  await input.waitFor({ state: 'visible', timeout: 15_000 });
  await input.fill(domain);
  await page.locator('form.service-catalog-domain-form button[type="submit"]').click();
  await expect(
    page.getByRole('heading', { name: new RegExp(`Offered services for ${domain}`, 'i') }),
  ).toBeVisible({ timeout: 15_000 });
});

When('{string} offers {string} to {string}', async ({}, username: string, serviceKey: string, domain: string) => {
  const page = pageForUser(username);
  await page.locator('#service-catalog-curation-key').fill(serviceKey);
  await page.locator(`${OFFER_FORM} button[type="submit"]`).click();
  // The success notice persists through the list reload; assert the exact text so
  // this is not a vacuous "something happened".
  await expect(page.locator('[data-testid="service-catalog-curation-notice"]')).toContainText(
    new RegExp(`Offered .*${serviceKey}.* to ${domain}`, 'i'),
    { timeout: 15_000 },
  );
});

When('{string} withdraws {string} from {string}', async ({}, username: string, serviceKey: string, domain: string) => {
  const page = pageForUser(username);
  // The form Withdraw button acts on the typed service key (cleared after an offer),
  // so re-enter it, then withdraw.
  await page.locator('#service-catalog-curation-key').fill(serviceKey);
  await page.locator(`${OFFER_FORM} button:has-text("Withdraw service")`).click();
  await expect(page.locator('[data-testid="service-catalog-curation-notice"]')).toContainText(
    new RegExp(`Withdrew .*${serviceKey}.* from ${domain}`, 'i'),
    { timeout: 15_000 },
  );
});

Then('{string} sees {string} in the offered catalog for {string}', async ({}, username: string, serviceKey: string, _domain: string) => {
  const page = pageForUser(username);
  const list = page.locator('[data-testid="service-catalog-curation-list"]');
  await expect(list).toBeVisible({ timeout: 15_000 });
  await expect(list.locator('.service-catalog-row__key', { hasText: serviceKey })).toHaveCount(1);
});

Then('{string} does not see {string} in the offered catalog for {string}', async ({}, username: string, serviceKey: string, _domain: string) => {
  const page = pageForUser(username);
  // Either the whole list is gone (empty state) or it simply omits the key.
  await expect(
    page.locator('[data-testid="service-catalog-curation-list"] .service-catalog-row__key', { hasText: serviceKey }),
  ).toHaveCount(0, { timeout: 15_000 });
});

// ── the ADMIN two-tier read-only degrade (cross-user propagation) ──

Then('{string} lands on the read-only forbidden catalog', async ({}, username: string) => {
  const page = pageForUser(username);
  await page.waitForURL((url) => url.pathname.endsWith('/service-catalog/forbidden'), { timeout: 20_000 });
  await expect(page.getByRole('heading', { name: /your domain.s offered catalog/i })).toBeVisible({ timeout: 10_000 });
  // Wait out the async GET /bff/admin/service-store — the list OR the empty state
  // renders once it settles, so downstream assertions don't race the load.
  await expect(
    page.locator('[data-testid="service-catalog-mycatalog-list"], [data-testid="service-catalog-mycatalog-empty"]'),
  ).toHaveCount(1, { timeout: 15_000 });
});

Then('{string} sees {string} in their read-only domain catalog', async ({}, username: string, serviceKey: string) => {
  const page = pageForUser(username);
  const list = page.locator('[data-testid="service-catalog-mycatalog-list"]');
  await expect(list).toBeVisible({ timeout: 15_000 });
  await expect(list.locator('.service-catalog-row__key', { hasText: serviceKey })).toHaveCount(1);
});

Then('{string} does not see {string} in their read-only domain catalog', async ({}, username: string, serviceKey: string) => {
  const page = pageForUser(username);
  await expect(
    page.locator('[data-testid="service-catalog-mycatalog-list"] .service-catalog-row__key', { hasText: serviceKey }),
  ).toHaveCount(0, { timeout: 15_000 });
});

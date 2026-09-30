// Step definitions backing features/catalog/service-store-step-up.feature — the
// Service Catalog's step-up-gated OFFER and PROVISION (hugmesh-superadmin-service-catalog-ui#4).
//
// MOCKED rows: page.route() answers the domain read and the gated write in the exact
// wire shapes hugmesh-admin-bff-api emits on origin/main (86cdf79):
//   refusal  403 + `X-Step-Up-Required: X-ServiceStore-StepUp`
//            + {"error":"<offering|provisioning> a service requires step-up re-authentication (present X-ServiceStore-StepUp)"}
//   bare     403 {"error":"Forbidden"} — no signal, no phrase (the superadmin-role denial)
//   accepted the ServiceCuration / ServiceDeployment row the component renders
// Every write is logged with its X-ServiceStore-StepUp header and body — the oracle
// for "sent N times" and "retried once with the token and the identical body".
// LIVE rows: a real fetch with the signed-in persona's bff_ cookie, capturing the
// status and the X-Step-Up-Required header.

import { expect, Route } from '@playwright/test';
import { Given, When, Then } from '../support/fixtures';
import { pageForUser, pageRegistry } from './_registry';

type Gated = 'offer' | 'provision';

interface SentWrite { url: string; body: string | null; token: string | null }

/** Every gated write the page actually sent, per kind — cleared when a scenario mocks it. */
const sent = new Map<Gated, SentWrite[]>();

/** The last capturing fetch: status + the step-up signal header, or null. */
const captured = { status: 0, signal: null as string | null };

const DEPLOYMENT_ID = 'dep-e2e-step-up-1';

/** The single persona a mocked scenario seeded (the last registered page). */
function actingPage() {
  const username = [...pageRegistry.keys()].pop();
  if (!username) throw new Error('No page registered — open the service-catalog first.');
  return pageForUser(username);
}

function stepUpRefusal(verb: string) {
  return {
    status: 403,
    contentType: 'application/json',
    headers: { 'X-Step-Up-Required': 'X-ServiceStore-StepUp' },
    body: JSON.stringify({
      error: `${verb} requires step-up re-authentication (present X-ServiceStore-StepUp)`,
    }),
  };
}

const BARE_403 = { status: 403, contentType: 'application/json', body: JSON.stringify({ error: 'Forbidden' }) };

/** Log the write, answer the FIRST with `first`, every later one with `accepted` —
 *  exactly the sequence ServiceStoreStepUpGate produces around a valid token. */
async function mockGatedWrite(
  kind: Gated,
  glob: string,
  first: Parameters<Route['fulfill']>[0],
  accepted: unknown,
): Promise<void> {
  sent.set(kind, []);
  await actingPage().route(glob, async (route) => {
    const req = route.request();
    if (req.method() !== 'POST') return route.fallback();
    const log = sent.get(kind)!;
    log.push({ url: req.url(), body: req.postData(), token: (await req.allHeaders())['x-servicestore-stepup'] ?? null });
    if (log.length === 1) return route.fulfill(first);
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(accepted) });
  });
}

function curationRow(domain: string, serviceKey: string) {
  const now = '2026-09-23T00:00:00Z';
  return {
    id: `cur-${serviceKey}`, domain, serviceKey, state: 'offered',
    curatedBySubject: 'e2e-mock', createdAt: now, updatedAt: now,
  };
}

function deploymentRow(domain: string, serviceKey: string, propagationState: string) {
  return {
    id: DEPLOYMENT_ID, domain, serviceKey, profileRef: null, state: 'active',
    createdAt: '2026-09-23T00:00:00Z', endingAt: null, enforceActions: null,
    propagationState, endedAt: null, createdBySubject: 'e2e-mock',
  };
}

// ── Mocks: reads ───────────────────────────────────────────────────────────

Given('the admin-bff serves an empty curation catalog for {string}', async ({}, domain: string) => {
  // GET /bff/superadmin/service-store/{domain} — exact path, so the /offer write
  // below is never answered by this route.
  await actingPage().route(`**/bff/superadmin/service-store/${domain}`, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
});

Given('the admin-bff serves one recorded {string} deployment for {string}', async ({}, serviceKey: string, domain: string) => {
  let provisioned = false;
  await actingPage().route(`**/bff/superadmin/service-store/${domain}/deployments`, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    // After an accepted provision the refreshed row reads applied, as the effector would report.
    provisioned = (sent.get('provision') ?? []).length > 1;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([deploymentRow(domain, serviceKey, provisioned ? 'applied' : 'pending')]),
    });
  });
});

// ── Mocks: the gated writes ────────────────────────────────────────────────

Given('the admin-bff will refuse the next offer to {string} demanding a step-up', async ({}, domain: string) => {
  await mockGatedWrite('offer', `**/bff/superadmin/service-store/${domain}/offer`,
    stepUpRefusal('offering a service'), curationRow(domain, 'owncast'));
});

Given('the admin-bff will refuse the next offer to {string} with a bare 403', async ({}, domain: string) => {
  await mockGatedWrite('offer', `**/bff/superadmin/service-store/${domain}/offer`, BARE_403, curationRow(domain, 'owncast'));
});

Given('the admin-bff will refuse the next provision in {string} demanding a step-up', async ({}, domain: string) => {
  await mockGatedWrite('provision', `**/bff/superadmin/service-store/${domain}/deployments/*/provision`,
    stepUpRefusal('provisioning a service'), deploymentRow(domain, 'owncast', 'applied'));
});

// ── Driving the views ──────────────────────────────────────────────────────

When('{string} submits an offer of {string}', async ({}, username: string, serviceKey: string) => {
  // Unlike `offers {string} to {string}` (curation-steps.ts) this expects NO outcome:
  // the scenario decides whether the write was paused, refused or accepted.
  const page = pageForUser(username);
  await page.locator('#service-catalog-curation-key').fill(serviceKey);
  await page.locator('form.service-catalog-offer-form button[type="submit"]').click();
});

When('{string} confirms the {string} challenge with the token {string}', async ({}, username: string, testId: string, token: string) => {
  const page = pageForUser(username);
  const challenge = page.locator(`[data-testid="${testId}"]`);
  await expect(challenge).toBeVisible({ timeout: 15_000 });
  await page.locator(`#${testId}-token`).fill(token);
  await page.locator(`[data-testid="${testId}-submit"]`).click();
});

When('{string} cancels the {string} challenge', async ({}, username: string, testId: string) => {
  const page = pageForUser(username);
  await expect(page.locator(`[data-testid="${testId}"]`)).toBeVisible({ timeout: 15_000 });
  await page.locator(`[data-testid="${testId}-cancel"]`).click();
});

// ── Assertions ─────────────────────────────────────────────────────────────

Then('{string} is shown the {string} step-up challenge for {string}', async ({}, username: string, testId: string, action: string) => {
  const page = pageForUser(username);
  const challenge = page.locator(`[data-testid="${testId}"]`);
  await expect(challenge).toBeVisible({ timeout: 15_000 });
  await expect(challenge).toHaveAttribute('role', 'group');
  await expect(challenge).toContainText(action);
  // Nothing to confirm until a token is typed — the control never sends an empty one.
  await expect(page.locator(`[data-testid="${testId}-submit"]`)).toBeDisabled();
});

Then('{string} is not shown the {string} step-up challenge', async ({}, username: string, testId: string) => {
  // The caller asserted the refusal alert first, so the page has settled.
  await expect(pageForUser(username).locator(`[data-testid="${testId}"]`)).toHaveCount(0);
});

Then('no curation success notice is shown to {string}', async ({}, username: string) => {
  await expect(pageForUser(username).locator('[data-testid="service-catalog-curation-notice"]')).toHaveCount(0);
});

Then('{string} sees the curation notice {string}', async ({}, username: string, text: string) => {
  await expect(pageForUser(username).locator('[data-testid="service-catalog-curation-notice"]'))
    .toHaveText(text, { timeout: 15_000 });
});

Then('{string} sees the curation error {string}', async ({}, username: string, text: string) => {
  const err = pageForUser(username).locator('[data-testid="service-catalog-curation-action-error"]');
  await expect(err).toHaveText(text, { timeout: 15_000 });
  await expect(err).toHaveAttribute('role', 'alert');
});

Then('{string} sees the add-service error {string}', async ({}, username: string, text: string) => {
  const err = pageForUser(username).locator('[data-testid="service-catalog-add-form-error"]');
  await expect(err).toHaveText(text, { timeout: 15_000 });
  await expect(err).toHaveAttribute('role', 'alert');
});

Then(/^the (offer|provision) (?:to|in) "([^"]*)" has been sent (\d+) times?$/, async ({}, kind: Gated, domain: string, n: string) => {
  const want = Number(n);
  await expect
    .poll(() => (sent.get(kind) ?? []).length, { message: `${kind} writes to ${domain}`, timeout: 15_000 })
    .toBe(want);
  for (const w of sent.get(kind) ?? []) expect(w.url).toContain(`/service-store/${domain}/`);
});

Then(/^the retried (offer|provision) (?:to|in) "([^"]*)" carried the token "([^"]*)" and the identical body$/,
  async ({}, kind: Gated, _domain: string, token: string) => {
    const [first, second] = sent.get(kind) ?? [];
    expect(first, 'the refused write').toBeTruthy();
    expect(second, 'the retried write').toBeTruthy();
    // The refused call carried NO token (a token-less call is byte-identical to pre-step-up)…
    expect(first.token).toBeNull();
    // …and the retry carries the confirmed token, to the same URL, with the same snapshot.
    expect(second.token).toBe(token);
    expect(second.url).toBe(first.url);
    expect(second.body).toBe(first.body);
  });

// ── LIVE rows (real persona, real admin-bff) ───────────────────────────────

When('{string} POSTs to {string} capturing the step-up signal with body:', async ({}, username: string, path: string, body: string) => {
  const page = pageForUser(username);
  const r = await page.evaluate(async ([url, payload]) => {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });
    return { status: res.status, signal: res.headers.get('X-Step-Up-Required') };
  }, [path, body] as const);
  captured.status = r.status;
  captured.signal = r.signal;
});

Then('the captured response was a 403 without any step-up signal', async ({}) => {
  expect(captured.status).toBe(403);
  expect(captured.signal).toBeNull();
});

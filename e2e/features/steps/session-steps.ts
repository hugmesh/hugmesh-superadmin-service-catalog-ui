// Mid-session role change — the live re-gate channel. SessionService (session.service.ts
// constructor) listens on the cross-tab 'storage' event AND the same-document
// 'hug-session-change' broadcast so a role grant/revoke in ANOTHER tab re-reads the
// session and re-renders the nav/guards WITHOUT a reload. This exercises that channel
// end-to-end: a second tab in the SAME context rewrites hug.session, which fires a
// real 'storage' event in the first tab.
//
// Pure client-side behaviour (no BFF write), so seeded localStorage sessions are the
// honest tool here (house rule: seeded only for pure client-side).

import { expect } from '@playwright/test';
import { Given, When } from '../support/fixtures';
import { sessionFor, SESSION_KEY } from '../../tests/helpers/roles';
import { pageRegistry } from './_registry';

// A CONDITIONAL seed (set only if absent) — unlike the standard loginAs, whose
// unconditional addInitScript re-runs on EVERY navigation and would overwrite a
// session another tab rewrote mid-scenario. Here the first load seeds superadmin;
// the later in-console navigation must preserve the downgraded session the second
// tab wrote, so the guard actually sees the revoked role.
Given('the superadmin session is seeded and the service-catalog opens at {string}', async ({ page, user }, route: string) => {
  const blob = JSON.stringify(sessionFor(user('superadmin')));
  await page.addInitScript(
    ([key, value]) => {
      if (!window.localStorage.getItem(key)) window.localStorage.setItem(key, value);
    },
    [SESSION_KEY, blob] as const,
  );
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  pageRegistry.set('superadmin', page);
});

When('a second tab rewrites the session to roles {string}', async ({ page }, rolesCsv: string) => {
  const tab2 = await page.context().newPage();
  // A same-origin document in the SAME context shares this origin's localStorage, so
  // writing the session there fires a genuine cross-document 'storage' event in the
  // first tab — the exact channel SessionService subscribes to.
  await tab2.goto('/service-catalog/add', { waitUntil: 'domcontentloaded' });
  await tab2.evaluate((csv) => {
    const roles = csv.split(',').map((r) => r.trim()).filter(Boolean);
    const raw = window.localStorage.getItem('hug.session');
    const cur = raw ? JSON.parse(raw) : {};
    window.localStorage.setItem('hug.session', JSON.stringify({ ...cur, roles }));
  }, rolesCsv);
  pageRegistry.set('second-tab', tab2);
});

When('the superadmin navigates within the console to {string}', async ({ page }, route: string) => {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  // Guard against a same-URL no-op: the guard must have re-run against the downgraded
  // session. The forbidden assertion in the feature is the real signal; this just
  // ensures navigation settled.
  await expect(page).toHaveURL(/\/service-catalog\//, { timeout: 15_000 });
});

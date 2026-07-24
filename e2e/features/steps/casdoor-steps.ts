// Real host-shell Casdoor login steps — the HONEST path for every scenario that
// makes a server-authoritative BFF call (all /bff/superadmin/** reads + writes and
// the /bff/admin/service-store two-tier read). See tests/helpers/roles.ts `login()`:
// it drives the hugmesh.systems host's federated login remote so the gateway
// sets the HttpOnly `bff_` cookie the bffAuthInterceptor rides. Contrast with the
// seeded `loginAs()` (access-steps.ts) which is honest ONLY for pure client-side
// guard/nav/session behaviour — a seeded session carries no `bff_` cookie, so a
// provision/offer/record/profile write 401/403s the moment E2E_CLUSTER=1 is on.
//
// All these steps are reached only from @cluster-tagged scenarios (the login
// remote is served by the host at /login, not by this remote's own dev shell).

import { Given } from '../support/fixtures';
import { login, newE2eContext, SeedUser } from '../../tests/helpers/roles';
import { ctxRegistry, pageRegistry } from './_registry';

/** Real Casdoor login on the DEFAULT context/page, then open a console route.
 *  Registers the page under the username so multi-user assertion steps can target
 *  it (single-user features can ignore the registration and use the default page). */
Given(
  '{string} signs in and opens the service-catalog at {string}',
  async ({ page, user }, username: string, route: string) => {
    const u: SeedUser = user(username);
    await login(page, u, route);
    pageRegistry.set(u.username, page);
  },
);

/** Real Casdoor login in a SECOND browser context (its own cookie jar) — the
 *  cross-user / concurrent-mutation half. newE2eContext trusts the e2e self-signed
 *  cert AND carries the project baseURL (browser.newContext does not inherit the
 *  project `use`, so a bare context fails the federation manifest fetch). The After
 *  hook in support/fixtures.ts closes every ctxRegistry context. */
Given(
  '{string} signs in a second session and opens the service-catalog at {string}',
  async ({ browser, user }, username: string, route: string) => {
    const u: SeedUser = user(username);
    const ctx = await newE2eContext(browser);
    const p = await ctx.newPage();
    await login(p, u, route);
    ctxRegistry.set(u.username, ctx);
    pageRegistry.set(u.username, p);
  },
);

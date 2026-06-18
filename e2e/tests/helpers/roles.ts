import { Browser, BrowserContext, Page, expect } from '@playwright/test';

/**
 * Role catalogue for the Superadmin Service Catalog console.
 *
 * Unlike the games host (which drives a federated Casdoor login form), this
 * remote derives its role flags purely from `localStorage['snap.session']`:
 * SessionService.load() parses that key and exposes `roles[]`-derived signals
 * (isSuperadmin / isAdmin / canManageStore / canReadOwnCatalog — see
 * src/app/session.service.ts). The host shell normally writes that session after
 * a Casdoor login and the remote re-reads it. In e2e we seed the SAME key
 * directly, so a "login" here is deterministic session injection — no Casdoor
 * round-trip, no federation login bundle.
 *
 * The `kind` tag drives which gating assertions run:
 *  - `superadmin` — canManageStore() true: sees the full nav (Add / Curation /
 *                   App profiles / Deployments) and reaches /service-catalog/add.
 *  - `admin`      — canManageStore() false, canReadOwnCatalog() true: bounced to
 *                   /service-catalog/forbidden, but the read-only "my domain's offered
 *                   catalog" degrade section renders.
 *  - `mod`        — bounced to /service-catalog/forbidden, NO catalog degrade.
 *  - `user`       — bounced to /service-catalog/forbidden, NO catalog degrade.
 */
export interface SeedUser {
  username: string;
  /** Bare lowercase Casdoor roles (reserved ROLE_/DOMAIN_ prefix already
   *  stripped upstream by the gateway/BFF converter). */
  roles: string[];
  kind: 'superadmin' | 'admin' | 'mod' | 'user';
  /** The issuer-derived home domain — drives cross-tenant isolation scenarios. */
  domain: string;
}

export const SEED_USERS: SeedUser[] = [
  // The privileged operator — the whole console is theirs.
  { username: 'superadmin', roles: ['user', 'admin', 'superadmin'], kind: 'superadmin', domain: 'acme.test' },

  // A second superadmin on a DIFFERENT brand — cross-tenant isolation: a
  // superadmin acting on their own platform must not silently leak another
  // brand's recorded deployments into the view.
  { username: 'superadmin-beta', roles: ['user', 'admin', 'superadmin'], kind: 'superadmin', domain: 'beta.test' },

  // Domain admin — DENY at the superadminGuard, but the forbidden screen offers
  // the read-only own-domain catalog degrade (canReadOwnCatalog).
  { username: 'admin', roles: ['user', 'admin'], kind: 'admin', domain: 'acme.test' },

  // Mod — DENY, and NO catalog degrade (canReadOwnCatalog is false).
  { username: 'mod', roles: ['user', 'mod'], kind: 'mod', domain: 'acme.test' },

  // Plain user — DENY, no degrade.
  { username: 'user', roles: ['user'], kind: 'user', domain: 'acme.test' },
];

/** localStorage key the SessionService persists the session under. */
export const SESSION_KEY = 'snap.session';

/** The in-remote forbidden mount path a DENY routes to (NOT '/forbidden', NOT
 *  '/login'). Mirrors SERVICE_CATALOG_FORBIDDEN in src/app/service-catalog.guard.ts. */
export const SERVICE_CATALOG_FORBIDDEN_PATH = '/service-catalog/forbidden';

export function resolveUser(username: string): SeedUser {
  const found = SEED_USERS.find((u) => u.username === username);
  if (!found) {
    throw new Error(
      `Unknown seed user: "${username}". Known: ${SEED_USERS.map((u) => u.username).join(', ')}`,
    );
  }
  return found;
}

/**
 * Build the SnapSession blob the SessionService expects (src/app/session.service.ts
 * SnapSession). Only the fields the Service Catalog console reads are load-bearing —
 * `roles` (the gating) and `bffToken` (the ServiceCatalogService Authorization header).
 */
export function sessionFor(user: SeedUser): Record<string, unknown> {
  return {
    id: `google:${user.username}@${user.domain}`,
    label: `${user.username}@${user.domain}`,
    provider: 'google',
    roles: user.roles,
    bffToken: `e2e-${user.username}-token`,
    registrationComplete: true,
    matrix: null,
    mastodon: null,
  };
}

/**
 * Create a context that trusts the e2e self-signed cert AND uses the same
 * baseURL as the project. `browser.newContext()` does NOT inherit project-level
 * `use` (Playwright design), so a manually-opened context misses
 * ignoreHTTPSErrors and every HTTPS request fails the cert check — the
 * federation manifest fetch is the first casualty.
 */
export async function newE2eContext(browser: Browser): Promise<BrowserContext> {
  return await browser.newContext({
    ignoreHTTPSErrors: true,
    baseURL: process.env.E2E_BASE_URL ?? 'https://host.docker.internal:8443',
  });
}

/**
 * "Log in" as a seed user by seeding `localStorage['snap.session']` BEFORE the
 * app boots, then navigating to a console route. We use addInitScript so the
 * session is present on the very first SessionService.load() — seeding after a
 * navigation would let the guard run against a logged-out session first.
 *
 * Returns after the requested route has settled (the console shell renders, or
 * the guard has bounced to the forbidden mount path — the caller asserts which).
 */
export async function loginAs(page: Page, user: SeedUser, route = '/service-catalog/add'): Promise<void> {
  const blob = JSON.stringify(sessionFor(user));
  await page.addInitScript(
    ([key, value]) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* storage unavailable — the route assertion will surface it */
      }
    },
    [SESSION_KEY, blob] as const,
  );
  await page.goto(route, { waitUntil: 'domcontentloaded' });
}

/** Read the persisted roles back off the page so a step can assert the session
 *  the SessionService actually loaded (the seed is the source of truth, but this
 *  catches a storage-partitioning regression). */
export async function sessionRoles(page: Page): Promise<string[]> {
  return await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    try {
      return (JSON.parse(raw) as { roles?: string[] }).roles ?? [];
    } catch {
      return [];
    }
  }, SESSION_KEY);
}

/** Assert the current URL path is the in-remote forbidden mount path. */
export async function expectForbidden(page: Page): Promise<void> {
  await page.waitForURL((url) => url.pathname.endsWith(SERVICE_CATALOG_FORBIDDEN_PATH), { timeout: 20_000 });
  await expect(page.getByRole('heading', { name: /don.t have access/i })).toBeVisible({ timeout: 10_000 });
}

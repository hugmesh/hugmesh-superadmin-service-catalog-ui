import { Browser, BrowserContext, Page, expect } from '@playwright/test';

/**
 * Role catalogue for the Superadmin Service Catalog console.
 *
 * Unlike the games host (which drives a federated Casdoor login form), this
 * remote derives its role flags purely from `localStorage['hug.session']`:
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
  /** env var the compose/cluster overlay routes this user's cred through for the
   *  REAL host-shell Casdoor login ({@link login}). Falls back to `E2E_PASSWORD`
   *  then `e2e-pass` (see {@link passwordFor}) so a missing env never throws. */
  passwordEnv: string;
}

export const SEED_USERS: SeedUser[] = [
  // The privileged operator — the whole console is theirs.
  { username: 'superadmin', roles: ['user', 'admin', 'superadmin'], kind: 'superadmin', domain: 'acme.test', passwordEnv: 'E2E_SUPERADMIN_PASSWORD' },

  // A second superadmin on a DIFFERENT brand — cross-tenant isolation: a
  // superadmin acting on their own platform must not silently leak another
  // brand's recorded deployments into the view. Also drives the two-superadmin
  // concurrent-mutation scenario (a second context ends a row the first is on).
  { username: 'superadmin-beta', roles: ['user', 'admin', 'superadmin'], kind: 'superadmin', domain: 'beta.test', passwordEnv: 'E2E_SUPERADMIN_BETA_PASSWORD' },

  // Domain admin (acme.test) — DENY at the superadminGuard, but the forbidden
  // screen offers the read-only own-domain catalog degrade (canReadOwnCatalog).
  // The two-tier /bff/admin/service-store read is scoped to THIS admin's own
  // issuer-derived domain, so it sees only what a superadmin offered to acme.test.
  { username: 'admin', roles: ['user', 'admin'], kind: 'admin', domain: 'acme.test', passwordEnv: 'E2E_ADMIN_PASSWORD' },

  // Domain admin on a DIFFERENT brand (beta.test) — the cross-user visibility
  // matrix: a service offered to acme.test must NEVER surface in this admin's
  // own-domain catalog. Mirrors admin-ui's admin-domain-a / admin-domain-b split.
  { username: 'admin-beta', roles: ['user', 'admin'], kind: 'admin', domain: 'beta.test', passwordEnv: 'E2E_ADMIN_BETA_PASSWORD' },

  // Mod — DENY, and NO catalog degrade (canReadOwnCatalog is false).
  { username: 'mod', roles: ['user', 'mod'], kind: 'mod', domain: 'acme.test', passwordEnv: 'E2E_MOD_PASSWORD' },

  // Plain user — DENY, no degrade.
  { username: 'user', roles: ['user'], kind: 'user', domain: 'acme.test', passwordEnv: 'E2E_USER_PASSWORD' },
];

/** localStorage key the SessionService persists the session under. */
export const SESSION_KEY = 'hug.session';

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
 * Build the HugSession blob the SessionService expects (src/app/session.service.ts
 * HugSession). Only `roles` is load-bearing for the console gating; auth to
 * /bff/** now rides on the HttpOnly `bff_` cookie (the bffAuthInterceptor sends
 * `withCredentials`), so the session no longer carries a browser Bearer.
 */
export function sessionFor(user: SeedUser): Record<string, unknown> {
  return {
    id: `google:${user.username}@${user.domain}`,
    label: `${user.username}@${user.domain}`,
    provider: 'google',
    roles: user.roles,
    registrationComplete: true,
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
 * "Log in" as a seed user by seeding `localStorage['hug.session']` BEFORE the
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

/** Resolve a seed user's password — per-user env override, then `E2E_PASSWORD`,
 *  then the `e2e-pass` default — without throwing on a missing env (mirrors the
 *  admin-ui / games e2e legs). */
export function passwordFor(user: SeedUser): string {
  return process.env[user.passwordEnv] ?? process.env['E2E_PASSWORD'] ?? 'e2e-pass';
}

/**
 * REAL host-shell Casdoor login — the honest path for scenarios that make
 * server-authoritative BFF calls (every /bff/superadmin/** read + write, and the
 * /bff/admin/service-store two-tier read).
 *
 * Unlike {@link loginAs} (which only seeds `localStorage['hug.session']`), this
 * drives the hugmesh.net host shell's federated login remote so the
 * gateway sets the HttpOnly `bff_` cookie via Set-Cookie. The `bffAuthInterceptor`
 * sends that cookie (`withCredentials`) on every request, so a subsequent
 * `provision` / `offer` / `record` / profile write actually authenticates —
 * whereas a seeded session carries NO `bff_` cookie and the write 401/403s the
 * moment E2E_CLUSTER=1 is flipped on.
 *
 * @cluster-only — this hits a LIVE Casdoor + host shell (the login remote is
 * served under the host at /login, NOT by this remote's own dev shell, which only
 * mounts /service-catalog). So it is only reached from `@cluster`-tagged scenarios
 * (skipped at runtime unless E2E_CLUSTER=1); bddgen + `--list` still discover them.
 *
 * On success the host writes `hug.session` (SessionService.set/broadcast); we
 * wait for that non-secret key so a follow-up guarded navigation doesn't race the
 * write (the bearer no longer lives in the browser — auth rides the cookie). The
 * form inputs hang off `formControlName` (the public selector contract shared
 * across the HugMesh login remote).
 */
export async function login(page: Page, user: SeedUser, route = '/service-catalog/add'): Promise<void> {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.locator('input[formControlName="username"]').waitFor({ state: 'visible', timeout: 20_000 });
  await page.fill('input[formControlName="username"]', user.username);
  await page.fill('input[formControlName="password"]', passwordFor(user));
  await page.click('button.login-btn');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 60_000 });
  await page.waitForFunction(
    () => {
      const raw = window.localStorage.getItem('hug.session');
      if (!raw) return false;
      try {
        return Boolean(JSON.parse(raw).id);
      } catch {
        return false;
      }
    },
    undefined,
    { timeout: 15_000 },
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

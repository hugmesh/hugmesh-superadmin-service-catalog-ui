import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

// The Superadmin Service Catalog remote is browsable standalone under /service-catalog
// (`ng serve service-catalog` mounts SERVICE_CATALOG_ROUTES at /service-catalog — see src/app/app.routes.ts)
// so the e2e harness drives the SAME mount path the host uses, which makes the
// in-remote guard redirect to /service-catalog/forbidden resolve identically here and
// under the snapdragon.systems host.
const baseURL = process.env.E2E_BASE_URL ?? 'https://host.docker.internal:8443';

// playwright-bdd compiles every .feature in features/ into a generated
// .spec.js under .features-gen/, picks them up via `testDir`, and wires the
// World fixture imported from features/support/fixtures.ts. Step definitions
// live under features/steps/; the AfterStep PNG hook + scenario reset live in
// features/support/fixtures.ts (registered against the same `test` instance the
// generated specs use — splitting createBdd hook calls across files races).
const bddTestDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: [
    'features/steps/**/*.ts',
    'features/support/**/*.ts',
  ],
  // NOTE: we deliberately do NOT set a `tags: 'not @skip'` filter here. A
  // config-level tag filter EXCLUDES matched scenarios from generation
  // entirely, so they'd vanish from `playwright test --list`. playwright-bdd
  // instead treats `@skip` as a special tag (generate/specialTags.ts) and emits
  // a `test.skip(...)` for those scenarios — they STILL appear in `--list`
  // (the offline-discoverable contract this harness validates on) but never
  // execute. Every feature here is `@skip @cluster` because each needs the
  // built remote served + a real admin-bff; the offline service-layer contract
  // is already proven by src/app/service-catalog-add-service.e2e.spec.ts.
});

export default defineConfig({
  // Single-worker. Matches the games + admin-ui legs: per-role session seeding +
  // federation init contend on a small dev stack and waitForURL stalls
  // intermittently under parallelism. Serial keeps the role matrix reliable.
  fullyParallel: false,
  workers: 1,
  // One retry catches the rare federation-init flake without papering over a real
  // regression — a deterministic bug fails twice in a row.
  retries: 1,
  timeout: 180_000,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'results/html', open: 'never' }],
  ],
  outputDir: 'results/artifacts',
  use: {
    baseURL,
    // Accept the e2e self-signed cert.
    ignoreHTTPSErrors: true,
    // Forced ON so the artefact harvest always has a per-step PNG (the AfterStep
    // hook in fixtures.ts) plus a full webm to scrub the whole scenario.
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'on',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      // BDD project — generated specs from .feature files plus their step
      // definitions. This repo ships ONLY the BDD project (no handwritten
      // tests/*.spec.ts); tests/helpers/roles.ts is shared support code the
      // steps import.
      name: 'bdd',
      testDir: bddTestDir,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

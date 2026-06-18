// playwright-bdd extends Playwright's `test` with a BDD World. We publish
// `test`/`expect` from here so every step file imports through one channel. The
// custom fixture surface stays small — a `user(username)` lookup that throws
// loudly on a typo (so a bad feature file fails at the step, not by silently
// acting as the wrong role).
//
// Hook registration (Before/After/AfterStep) is also inlined here.
// playwright-bdd's createBdd(test) returns hook factories that MUST be called
// against the very same test instance the generated specs use. Splitting hook
// calls across files (each loaded independently via the steps[] glob) can race —
// the symptom is hooks that never fire even though they're registered.

import { test as base, createBdd } from 'playwright-bdd';
import { SEED_USERS, SeedUser, resolveUser } from '../../tests/helpers/roles';
import { ctxRegistry, resetRegistry } from '../steps/_registry';

interface UserLookup {
  /** Resolve a seed user by username. Throws on miss so a typo in a feature
   *  file fails loudly instead of acting as whoever we last logged in as. */
  user(username: string): SeedUser;
}

export const test = base.extend<UserLookup>({
  user: async ({}, use) => {
    await use((username: string) => resolveUser(username));
  },
});

export { SEED_USERS };

export const { Given, When, Then, Step, Before, After, BeforeStep, AfterStep, BeforeAll, AfterAll } =
  createBdd(test);

// ─── Step-level screenshot capture ─────────────────────────────────
// Every step gets a PNG attached to the HTML report so a reviewer can see the UI
// state at every transition without re-running.

let stepCounter = 0;

// ─── Cluster-dependent skip gate ───────────────────────────────────
// Every scenario here is tagged `@cluster`: it needs the built remote served at
// a baseURL (the snapdragon.systems host shell, or `ng serve service-catalog`) plus a
// real admin-bff /bff/superadmin/service-store. That stack is NOT present
// offline / in CI, so we SKIP `@cluster` scenarios at runtime unless
// `E2E_CLUSTER=1` is exported (the cluster-e2e job sets it).
//
// This is the runtime equivalent of an `@skip` tag, chosen deliberately over the
// feature/scenario `@skip` special tag: in playwright-bdd 8.5.x an `@skip` tag
// EXCLUDES the scenario from bddgen generation entirely, so it would vanish from
// `playwright test --list`. A runtime skip keeps every scenario DISCOVERABLE by
// `--list` (the offline contract this harness validates) while never executing
// it on a bare runner.
const CLUSTER_AVAILABLE = process.env.E2E_CLUSTER === '1';

Before({ tags: '@cluster' }, async () => {
  test.skip(!CLUSTER_AVAILABLE, 'cluster-dependent: set E2E_CLUSTER=1 with the remote served + admin-bff reachable');
});

Before(async () => {
  stepCounter = 0;
  resetRegistry();
});

AfterStep(async ({ page, $step, $testInfo }) => {
  stepCounter += 1;
  // Path-based attach. Body-based (in-memory Buffer) attachments succeed at
  // attach time but Playwright's HTML reporter only persists path-based ones
  // into html/data — body attachments never become viewable assets. Write under
  // testInfo.outputDir so the runner tracks it as a real file, then attach by path.
  try {
    const stepTitle = ($step as { title?: string })?.title ?? `step-${stepCounter}`;
    const safeName = `${String(stepCounter).padStart(2, '0')}-${stepTitle}`
      .replace(/[^a-z0-9_-]+/gi, '-')
      .slice(0, 80);
    const filePath = $testInfo.outputPath(`${safeName}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    await $testInfo.attach(`step ${safeName}`, { path: filePath, contentType: 'image/png' });
  } catch {
    // Page closed mid-step (e.g. context torn down) — drop silently.
  }
});

After(async () => {
  // Close contexts owned by this scenario. Without this, the second-user
  // context from a cross-tenant scenario leaks into the next one and the leaked
  // tab competes over federation init / session storage when the next scenario
  // seeds a session.
  for (const ctx of ctxRegistry.values()) {
    try {
      await ctx.close();
    } catch {
      /* already closed */
    }
  }
  resetRegistry();
  stepCounter = 0;
});

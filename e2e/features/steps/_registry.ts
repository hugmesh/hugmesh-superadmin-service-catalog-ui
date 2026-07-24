// Shared per-scenario state. playwright-bdd recreates the test instance for
// each scenario; the maps below are reset in the Before/After hooks in
// features/support/fixtures.ts so contexts/pages don't leak across scenarios.

import { BrowserContext, Page } from '@playwright/test';

export const pageRegistry = new Map<string, Page>();
export const ctxRegistry = new Map<string, BrowserContext>();

export function resetRegistry(): void {
  pageRegistry.clear();
  ctxRegistry.clear();
}

/**
 * Resolve the Page a multi-user step should act on, keyed by username. A sign-in
 * step registers the acting user's page here; a cross-user / concurrent step then
 * targets each user's own context by name. Throws loudly (never silently falls
 * back to a stale page) so a feature that references a user who never signed in
 * fails at the step instead of asserting against the wrong session.
 */
export function pageForUser(username: string): Page {
  const p = pageRegistry.get(username);
  if (!p) {
    throw new Error(
      `No page registered for "${username}" — a sign-in step must run first. ` +
        `Known: ${[...pageRegistry.keys()].join(', ') || '(none)'}`,
    );
  }
  return p;
}

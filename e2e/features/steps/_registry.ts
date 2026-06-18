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

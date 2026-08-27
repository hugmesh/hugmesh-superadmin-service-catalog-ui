#!/usr/bin/env node
/**
 * Assert the BUILT ARTEFACT actually carries every route this remote declares.
 *
 * The builder exiting 0 is not evidence that a route shipped: native-federation emits
 * the exposed module as its own chunk, and it is that chunk — not the dev bundle, not
 * `dist/` in general — that the hugmesh.net host loads through `loadRemoteModule()`.
 * A route can compile, pass its unit tests, and still be absent from the file the host
 * fetches. So this reads the emitted `remoteEntry.json`, resolves the chunk it names for
 * `./ServiceCatalog`, and greps THAT file for each route path.
 *
 * TWO independent checks, because one alone is a tautology:
 *
 *   1. DERIVED — every route path found in src/app/service-catalog.routes.ts must be
 *      present in the chunk. Catches "the route exists in source but did not ship".
 *      This half cannot go stale as routes are added, but on its own it is satisfied by
 *      its own input: DELETE a route from the source and the derived expectation
 *      disappears with it, and the check still passes. (Measured — it did.)
 *   2. REQUIRED — a floor of route paths written down HERE, deliberately NOT derived
 *      from the file under test. Catches "the route was removed". Adding a route to
 *      the console means adding it to this list; that is the point, not an oversight.
 *
 * A derived list that silently comes back empty would make check 1 a vacuous pass, so an
 * empty (or implausibly short) derivation is a hard failure, not a quiet success.
 *
 * The chunk is matched on `path:"<p>",component:` and NOT on the bare `path:"<p>"`. The
 * bare form was tried first and is a measured FALSE POSITIVE: the console's nav item array
 * also minifies to `path:"optional-services",label:...`, so deleting the ROUTE while
 * leaving the nav link in place still satisfied the loose grep — a link that 404s in the
 * router would have reported as "shipped". `,component:` is present on every Route in this
 * module and on none of the nav items.
 *
 *   node scripts/assert-artefact-routes.mjs [distDir]
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist/service-catalog/browser';
const routesSource = 'src/app/service-catalog.routes.ts';
const exposedKey = './ServiceCatalog';

/** Minimum number of route paths we ever expect to derive. Guards the derivation itself:
 *  a regex that stops matching would otherwise yield [] and "pass". */
const MIN_ROUTES = 5;

/** The floor, written down independently of the routes file so that deleting a route
 *  from source cannot delete the expectation along with it. */
const REQUIRED = [
  'add',
  'create',
  'curation',
  'profiles',
  'deployments',
  'optional-services',
  'forbidden',
];

function die(message) {
  console.error(`assert-artefact-routes: ${message}`);
  process.exit(1);
}

// ── 1. derive the expected route paths from the source of truth ──────────────
let source;
try {
  source = readFileSync(routesSource, 'utf8');
} catch {
  die(`cannot read ${routesSource}`);
}
const paths = [...source.matchAll(/\bpath:\s*'([^']*)'/g)]
  .map((m) => m[1])
  .filter((p) => p.length > 0);
const expected = [...new Set(paths)];

if (expected.length < MIN_ROUTES) {
  die(
    `derived only ${expected.length} route path(s) from ${routesSource} ` +
      `(expected at least ${MIN_ROUTES}). The derivation is broken — refusing to ` +
      `report success over an empty list.`,
  );
}

const undeclared = REQUIRED.filter((p) => !expected.includes(p));
if (undeclared.length > 0) {
  die(
    `${routesSource} no longer declares required route(s): ${undeclared.join(', ')}. ` +
      `A route that is removed from source is not "shipped" — it is gone.`,
  );
}

// ── 2. resolve the chunk the host actually loads ─────────────────────────────
let entry;
try {
  entry = JSON.parse(readFileSync(join(dist, 'remoteEntry.json'), 'utf8'));
} catch {
  die(`cannot read ${join(dist, 'remoteEntry.json')} — run \`npm run build\` first`);
}
const exposed = (entry.exposes ?? []).find((e) => e.key === exposedKey);
if (!exposed?.outFileName) {
  die(`remoteEntry.json does not expose ${exposedKey} — the host cannot load this remote`);
}

let chunk;
try {
  chunk = readFileSync(join(dist, exposed.outFileName), 'utf8');
} catch {
  die(`cannot read the exposed chunk ${exposed.outFileName}`);
}

// ── 3. assert each route path is present in that chunk ───────────────────────
const missing = expected.filter((p) => !chunk.includes(`path:"${p}",component:`));
if (missing.length > 0) {
  die(
    `the exposed chunk ${exposed.outFileName} is MISSING route(s): ${missing.join(', ')}. ` +
      `The build exited 0 but the host would not see ${missing.length === 1 ? 'this route' : 'these routes'}.`,
  );
}

console.log(
  `assert-artefact-routes: ${expected.length} route(s) present in ${exposed.outFileName} ` +
    `(${exposedKey}): ${expected.join(', ')}\n` +
    `assert-artefact-routes: all ${REQUIRED.length} required route(s) declared and shipped.`,
);

#!/usr/bin/env node
/**
 * Pin the response-header contract this image ships — value by value, block by block.
 *
 * WHY A GUARD AND NOT A grep. nginx `add_header` does NOT merge across nesting levels:
 * the moment a `location` sets ONE add_header of its own it discards EVERY inherited
 * server-scope one. So "is COEP in nginx.conf" is the wrong question, and a grep that
 * answers it reports GREEN for a conf where the block that actually serves index.html
 * emits nothing. That is not hypothetical — it is the shape this file's sibling
 * `assert-artefact-routes.mjs` was written for (a thing present in source but absent
 * from what ships), and it is why every check below is asked per BLOCK, through the
 * parser in ./nginx-conf.mjs.
 *
 * WHAT IT CANNOT DO. It reads a file. It cannot prove nginx accepts the conf, that the
 * browser accepts the policy, or that the page still renders under it — a
 * Permissions-Policy naming a feature Chrome dropped, or a COEP that starves a
 * subresource, leaves this guard perfectly green and the console full of violations.
 * `scripts/verify-served-page.mjs` is the half that drives a real browser; the two are
 * a pair and neither is sufficient. Wired: `npm run verify:headers` (also run inside
 * the image build) and `npm run verify:page` (CI `headers` job).
 *
 *   node scripts/assert-nginx-headers.mjs [nginx.conf]
 */
import { parseNginxConf, serverBlock, locationBlock, emittedHeaders, subFilters } from './nginx-conf.mjs';

const CONF = process.argv[2] ?? 'nginx.conf';

/**
 * The pinned values, written down HERE rather than derived from the file under test.
 * A derived expectation is satisfied by its own input: delete the header from
 * nginx.conf and a derived check deletes the expectation with it and still passes.
 * Changing a value below is therefore the deliberate act of changing the contract —
 * that is the point of the file, not an inconvenience.
 *
 * The Permissions-Policy list is the EMPTY allowlist `()` for every feature, which
 * denies every origin including self. That is correct for THIS console specifically:
 * it has no camera / microphone / geolocation / fullscreen / WebAuthn / clipboard code
 * path (`src/app`, excluding the generated `src/app/api` client). Every name here was
 * confirmed present in Chrome's `document.featurePolicy.features()`; an unrecognised
 * name makes the browser log `Unrecognized feature`, which verify-served-page.mjs
 * fails on, so do not add one speculatively.
 */
const PERMISSIONS_POLICY = [
  'accelerometer', 'autoplay', 'camera', 'display-capture', 'encrypted-media',
  'fullscreen', 'gamepad', 'geolocation', 'gyroscope', 'hid', 'idle-detection',
  'magnetometer', 'microphone', 'midi', 'payment', 'picture-in-picture',
  'publickey-credentials-create', 'publickey-credentials-get', 'screen-wake-lock',
  'serial', 'sync-xhr', 'usb', 'xr-spatial-tracking',
].map((f) => `${f}=()`).join(', ');

/** Emitted by the server block AND repeated in every location that sets any add_header. */
const REQUIRED_EVERYWHERE = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  // ── issue #5 ──
  'Cross-Origin-Embedder-Policy': 'require-corp',
  // same-origin, NOT cross-origin: the superadmin gateway serves this console at a
  // path on its own origin and the host shell refuses a cross-origin remoteEntry, so
  // nothing ever fetches these bytes cross-origin. See the derivation in nginx.conf.
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': PERMISSIONS_POLICY,
};

/** Only the block that serves index.html carries the CSP + the CORS opener. */
const DOCUMENT_ONLY = {
  'Access-Control-Allow-Origin': '*',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'nonce-$cspnonce' blob:; " +
    "style-src 'self' 'unsafe-inline' blob:; img-src 'self' data: blob: https:; " +
    "font-src 'self' data:; connect-src 'self' blob: https: wss:; worker-src 'self' blob:; " +
    "base-uri 'self'; object-src 'none'; frame-ancestors 'none'",
};

/**
 * The nonce contract, as three sub_filters that must ALL be present.
 *   1. every <script> in index.html gets the per-response nonce;
 *   2. the build-time marker nonce is REMOVED — leaving it would put TWO nonce
 *      attributes on the tag, and a duplicate-attribute parse error makes CSP treat
 *      the element as "Not Nonceable" (CSP3, "is element nonceable", step 3), so a
 *      perfectly correct nonce stops counting;
 *   3. the root element's ngCspNonce marker resolves to that same nonce, so Angular's
 *      runtime style nonce and the header nonce are one value.
 * Drop any one of the three and the page still returns HTTP 200 — which is exactly why
 * it is pinned here.
 */
const REQUIRED_SUB_FILTERS = [
  { from: '<script', to: '<script nonce="$cspnonce"' },
  { from: ' nonce="__HUG_CSP_NONCE__"', to: '' },
  { from: 'ngcspnonce="__HUG_CSP_NONCE__"', to: 'ngcspnonce="$cspnonce"' },
];

const problems = [];
const checks = [];

function expectHeaders(label, emitted, expected) {
  for (const [name, value] of Object.entries(expected)) {
    checks.push(`${label}:${name}`);
    const got = emitted.get(name);
    if (got === undefined) {
      problems.push(`${label} does not emit ${name}. nginx does NOT inherit add_header into a block that sets any of its own, so this response goes out without it.`);
    } else if (got !== value) {
      problems.push(`${label} ${name}\n      pinned:  ${value}\n      conf:    ${got}`);
    }
  }
}

const root = parseNginxConf(CONF);
const server = serverBlock(root);
const doc = locationBlock(server, '/');
const health = locationBlock(server, '= /healthz');

expectHeaders('server', emittedHeaders(server, null), REQUIRED_EVERYWHERE);
expectHeaders('location /', emittedHeaders(doc, server), { ...REQUIRED_EVERYWHERE, ...DOCUMENT_ONLY });
expectHeaders('location = /healthz', emittedHeaders(health, server), REQUIRED_EVERYWHERE);

// The CSP must never gain 'unsafe-inline' in script-src — that would silently retire
// the nonce, since a nonce present in script-src is what makes 'unsafe-inline' ignored.
const csp = emittedHeaders(doc, server).get('Content-Security-Policy') ?? '';
const scriptSrc = /script-src([^;]*)/.exec(csp)?.[1] ?? '';
checks.push('location /:script-src has no unsafe-inline');
if (scriptSrc.includes("'unsafe-inline'")) {
  problems.push(`location / script-src contains 'unsafe-inline' — that retires the nonce contract entirely.`);
}

// Every location that emits ANY header must emit the full required set: a new location
// added later with one add_header of its own silently loses all of these.
for (const block of server.blocks) {
  if (block === doc || block === health) continue;
  if (!block.directives.some((d) => d.name === 'add_header')) continue;
  expectHeaders(block.header, emittedHeaders(block, server), REQUIRED_EVERYWHERE);
}

const filters = subFilters(doc);
for (const want of REQUIRED_SUB_FILTERS) {
  checks.push(`location /:sub_filter ${want.from}`);
  if (!filters.some((f) => f.from === want.from && f.to === want.to)) {
    problems.push(`location / is missing sub_filter '${want.from}' '${want.to}' — the nonce contract needs all ${REQUIRED_SUB_FILTERS.length}.`);
  }
}

// Guard the guard. Counting the checks SCHEDULED proves nothing — that number is fixed
// by this file and would stay 27 against an empty conf. What can go vacuous is the
// PARSE, so the floor is on what was actually read out of the file: the directives
// themselves. A parser that silently stops recognising `add_header` would otherwise
// turn every assertion above into "missing", or — worse, if the failure were in block
// nesting instead — into a pass inherited from the wrong parent.
const parsedHeaders = [server, ...server.blocks]
  .flatMap((b) => b.directives.filter((d) => d.name === 'add_header')).length;
const MIN_PARSED_HEADERS = 20;
if (parsedHeaders < MIN_PARSED_HEADERS) {
  console.error(`assert-nginx-headers: the parser found only ${parsedHeaders} add_header directive(s) in ${CONF} (expected >= ${MIN_PARSED_HEADERS}). The parse is broken or the conf was gutted — refusing to report success over an empty reading.`);
  process.exit(1);
}
const parsedFilters = subFilters(doc).length;
if (parsedFilters < REQUIRED_SUB_FILTERS.length) {
  console.error(`assert-nginx-headers: the parser found only ${parsedFilters} sub_filter directive(s) in \`location /\` (expected >= ${REQUIRED_SUB_FILTERS.length}).`);
  process.exit(1);
}

if (problems.length > 0) {
  console.error(`assert-nginx-headers: FAIL — ${problems.length} problem(s) in ${CONF}:`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(
  `assert-nginx-headers: ${checks.length} pinned assertion(s) hold in ${CONF} across ` +
  `server + ${server.blocks.filter((b) => b.header.startsWith('location')).length} location block(s); ` +
  `${REQUIRED_SUB_FILTERS.length}/${REQUIRED_SUB_FILTERS.length} nonce sub_filters present.`,
);

#!/usr/bin/env node
/**
 * Load the BUILT page in a real headless browser behind the REAL nginx.conf and
 * assert the hardened response headers neither blank the page nor block a single
 * resource.
 *
 * WHY THIS EXISTS SEPARATELY FROM `assert-nginx-headers.mjs`. That guard proves
 * the conf still SAYS the right thing. It cannot prove the policy is survivable:
 * a `Permissions-Policy` naming a feature Chrome does not know, a
 * `Cross-Origin-Embedder-Policy` that starves a subresource, a CSP nonce that
 * stops flowing — every one of those leaves the conf looking perfect and the
 * console full of violations, or the page blank at HTTP 200 (the exact failure
 * mode recorded for this stack: a UI that sends no usable CSP renders EMPTY with
 * no server error, which reads like a routing bug). Only a browser can tell the
 * difference, so this drives one.
 *
 *   node scripts/verify-served-page.mjs [--server=nginx|replay] [--dist=DIR]
 *
 *   --server=nginx   (default when `docker` is on PATH) runs the SAME pinned
 *                    image the Dockerfile deploys, with THIS repo's nginx.conf,
 *                    over the real dist. Proves nginx parses the conf and emits
 *                    what we think it does — a static reading cannot.
 *   --server=replay  a dependency-free Node origin that replays the header set
 *                    parsed out of nginx.conf (same parser as the static guard)
 *                    and applies the same nonce sub_filter. For runners with a
 *                    browser but no docker.
 *
 * Chrome is driven over the DevTools Protocol through Node's built-in WebSocket
 * — deliberately NO playwright/puppeteer dependency, so this runs in the same
 * `node:alpine + apk add chromium` container the unit-test job already builds.
 * Set CHROME_BIN (the test job already does) or let it search the usual names.
 *
 * EXIT CODES: 0 only when the page bootstrapped AND nothing was blocked AND the
 * document carried every expected header. Anything it cannot check — no browser,
 * no dist, no docker in nginx mode — is a HARD FAILURE, never a silent skip: an
 * absent check that reports green is the failure mode this repo has been bitten
 * by before (see scripts/assert-artefact-routes.mjs, and the DAST harness that
 * turned "no scan happened" into a pass).
 */
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { readFileSync, existsSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { parseNginxConf, serverBlock, locationBlock, emittedHeaders, subFilters } from './nginx-conf.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)=?(.*)$/.exec(a);
    return m ? [m[1], m[2] === '' ? true : m[2]] : [a, true];
  }),
);

const REPO = resolve(new URL('..', import.meta.url).pathname);
const CONF = resolve(args.conf ?? join(REPO, 'nginx.conf'));
const DIST = resolve(args.dist ?? join(REPO, 'dist/service-catalog/browser'));
const NGINX_IMAGE = args.image ?? 'nginxinc/nginx-unprivileged:1.27-alpine';

function die(msg) {
  console.error(`verify-served-page: FAIL — ${msg}`);
  process.exit(1);
}

if (!existsSync(join(DIST, 'index.html'))) {
  die(`no built page at ${DIST}/index.html — run \`npm run build:service-catalog\` first. ` +
      `Refusing to report success without loading anything.`);
}

const hasDocker = spawnSync('docker', ['version'], { stdio: 'ignore' }).status === 0;
const mode = args.server ?? (hasDocker ? 'nginx' : 'replay');
if (mode === 'nginx' && !hasDocker) die('--server=nginx needs docker on PATH');
if (mode !== 'nginx' && mode !== 'replay') die(`unknown --server=${mode}`);

// ── the header set the conf says the document location emits ─────────────────
const root = parseNginxConf(CONF);
const server = serverBlock(root);
const docLoc = locationBlock(server, '/');
const docHeaders = emittedHeaders(docLoc, server);
const filters = subFilters(docLoc);

// ── serve ────────────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml',
  '.map': 'application/json', '.woff2': 'font/woff2', '.txt': 'text/plain',
};

async function startReplay() {
  const srv = createServer((req, res) => {
    const nonce = randomBytes(16).toString('hex');
    const url = new URL(req.url, 'http://localhost');
    // The BFF is not part of this probe's subject. Answer it the way the real
    // gateway answers a logged-out console (401 JSON) instead of letting the SPA
    // catch-all hand HttpClient an HTML body, which would raise an app-level
    // parse error that has nothing to do with the header policy under test.
    if (url.pathname.startsWith('/bff/')) {
      res.writeHead(401, { 'content-type': 'application/json' });
      res.end('{"error":"unauthenticated"}');
      return;
    }
    let file = join(DIST, url.pathname);
    if (!file.startsWith(DIST) || !existsSync(file) || statSync(file).isDirectory()) {
      file = join(DIST, 'index.html'); // try_files … /index.html
    }
    let body = readFileSync(file);
    const type = MIME[extname(file)] ?? 'application/octet-stream';
    if (type === 'text/html') {
      let text = body.toString('utf8');
      for (const f of filters) text = text.split(f.from).join(f.to.replaceAll('$cspnonce', nonce));
      body = Buffer.from(text, 'utf8');
    }
    const headers = { 'content-type': type, 'content-length': body.length };
    for (const [name, value] of docHeaders) headers[name] = value.replaceAll('$cspnonce', nonce);
    res.writeHead(200, headers);
    res.end(body);
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  return { base: `http://127.0.0.1:${srv.address().port}`, stop: () => srv.close() };
}

async function startNginx() {
  const name = `service-catalog-headers-probe-${process.pid}`;
  const run = spawnSync('docker', [
    'run', '-d', '--rm', '--name', name,
    '-p', '127.0.0.1:0:8080',
    '-v', `${CONF}:/etc/nginx/conf.d/default.conf:ro`,
    '-v', `${DIST}:/usr/share/nginx/html:ro`,
    NGINX_IMAGE,
  ], { encoding: 'utf8' });
  if (run.status !== 0) die(`docker run ${NGINX_IMAGE} failed: ${run.stderr.trim()}`);
  const port = spawnSync('docker', ['port', name, '8080/tcp'], { encoding: 'utf8' })
    .stdout.trim().split('\n')[0].split(':').pop();
  const stop = () => spawnSync('docker', ['rm', '-f', name], { stdio: 'ignore' });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 60; i += 1) {
    try {
      const r = await fetch(`${base}/healthz`);
      if (r.ok) return { base, stop, logs: () => spawnSync('docker', ['logs', name], { encoding: 'utf8' }).stderr };
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  const logs = spawnSync('docker', ['logs', name], { encoding: 'utf8' });
  stop();
  die(`nginx never became ready — it almost certainly refused this nginx.conf:\n${logs.stderr}${logs.stdout}`);
}

// ── a SECOND origin, used to prove COEP is live and not decorative ───────────
// Same host, different port => a different origin. It serves the same 1x1 PNG twice:
// once with NO Cross-Origin-Resource-Policy and once with `cross-origin`. Under
// `Cross-Origin-Embedder-Policy: require-corp` the browser must block the first and
// allow the second. Asserting BOTH is what makes it a measurement instead of a
// coincidence: a blocked image alone is equally consistent with a dead server, a typo
// in the URL, or a firewall — the CORP-carrying twin loading over the same connection
// rules all of those out and leaves COEP as the only explanation for the block.
//
// WHY HTTPS, AND WHY THAT IS NOT A TEST CONVENIENCE. Over http:// this probe measures
// nothing: the page's own CSP (`img-src 'self' data: blob: https:`) rejects the image
// before COEP is ever consulted, and BOTH legs come back blocked — MEASURED, that is
// what the first version of this file did. The CSP allows the whole `https:` scheme,
// though, so a cross-origin HTTPS image is exactly the case where COEP is the only
// thing standing between this console and a third-party subresource. That is the case
// worth proving, so the sentinel speaks TLS and chrome is launched with
// --ignore-certificate-errors for its self-signed cert.
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
async function startSentinel() {
  const dir = mkdtempSync(join(tmpdir(), 'service-catalog-sentinel-'));
  const key = join(dir, 'k.pem');
  const cert = join(dir, 'c.pem');
  const gen = spawnSync('openssl', [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert,
    '-days', '1', '-subj', '/CN=coep-sentinel.invalid',
    '-addext', 'subjectAltName=IP:127.0.0.1',
  ], { encoding: 'utf8' });
  if (gen.status !== 0) {
    die('openssl is required to mint the COEP sentinel certificate (see the comment above ' +
        'startSentinel): without HTTPS the page\'s own CSP blocks the probe before COEP is ' +
        'consulted, and the leg would pass vacuously. Install openssl, or run with ' +
        `--no-coep-probe to state plainly that COEP enforcement was NOT measured.\n${gen.stderr}`);
  }
  const srv = createHttpsServer({ key: readFileSync(key), cert: readFileSync(cert) }, (req, res) => {
    const headers = { 'content-type': 'image/png', 'content-length': PNG_1x1.length };
    if (req.url.startsWith('/corp')) headers['Cross-Origin-Resource-Policy'] = 'cross-origin';
    res.writeHead(200, headers);
    res.end(PNG_1x1);
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  return { base: `https://127.0.0.1:${srv.address().port}`, stop: () => { srv.close(); rmSync(dir, { recursive: true, force: true }); } };
}

// ── a very small CDP client over Node's built-in WebSocket ───────────────────
function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
    ...(existsSync('/home') ? [] : []),
  ].filter(Boolean);
  for (const c of candidates) if (existsSync(c)) return c;
  // playwright's cached download, when present (dev boxes)
  const pw = process.env.PLAYWRIGHT_CHROMIUM;
  if (pw && existsSync(pw)) return pw;
  return null;
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.handlers = [];
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id !== undefined && this.pending.has(msg.id)) {
        const { resolve: res, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : res(msg.result);
        return;
      }
      for (const h of this.handlers) h(msg);
    });
  }
  on(fn) { this.handlers.push(fn); }
  send(method, params = {}, sessionId) {
    const id = (this.id += 1);
    return new Promise((res, reject) => {
      this.pending.set(id, { resolve: res, reject });
      this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
}

async function main() {
  const chrome = findChrome();
  if (!chrome) die('no chromium binary — set CHROME_BIN. (A probe that cannot open a browser must FAIL, not skip.)');

  const origin = mode === 'nginx' ? await startNginx() : await startReplay();
  // --no-coep-probe: the operator's explicit opt-out (a runner with no openssl). It
  // does not quietly pass — the summary says COEP enforcement was NOT MEASURED.
  const coepProbe = !args['no-coep-probe'];
  const sentinel = coepProbe ? await startSentinel() : { base: '\u0000none', stop: () => {} };
  const userDataDir = `/tmp/service-catalog-headers-probe-${process.pid}`;
  const proc = spawn(chrome, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    // For the COEP sentinel's self-signed cert ONLY. It does not relax CSP, COEP or
    // CORP — the policies under test are unaffected by it.
    '--ignore-certificate-errors',
    '--remote-debugging-port=0', `--user-data-dir=${userDataDir}`,
    '--no-first-run', '--no-default-browser-check', 'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  const wsUrl = await new Promise((res, rej) => {
    let buf = '';
    const t = setTimeout(() => rej(new Error(`chrome never printed a DevTools endpoint:\n${buf}`)), 30000);
    proc.stderr.on('data', (d) => {
      buf += d.toString();
      const m = /ws:\/\/[^\s]+/.exec(buf);
      if (m) { clearTimeout(t); res(m[0]); }
    });
    proc.on('exit', (c) => { clearTimeout(t); rej(new Error(`chrome exited ${c}:\n${buf}`)); });
  });

  const cleanup = () => { try { proc.kill('SIGKILL'); } catch {} origin.stop(); sentinel.stop(); };
  process.on('exit', cleanup);

  const browserWs = new WebSocket(wsUrl);
  await new Promise((r, j) => { browserWs.addEventListener('open', r); browserWs.addEventListener('error', j); });
  const cdp = new Cdp(browserWs);

  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

  const consoleErrors = [];
  const logEntries = [];
  const exceptions = [];
  const failed = [];
  const benign = [];
  const coepEvidence = [];
  const requests = new Map();
  const responses = [];

  cdp.on((msg) => {
    if (msg.sessionId !== sessionId) return;
    const p = msg.params ?? {};
    switch (msg.method) {
      case 'Runtime.consoleAPICalled':
        if (p.type === 'error' || p.type === 'warning') {
          consoleErrors.push(`${p.type}: ${(p.args ?? []).map((a) => a.value ?? a.description ?? a.type).join(' ')}`);
        }
        break;
      case 'Runtime.exceptionThrown':
        exceptions.push(p.exceptionDetails?.exception?.description ?? p.exceptionDetails?.text ?? 'exception');
        break;
      case 'Log.entryAdded':
        if (p.entry.level === 'error' || p.entry.level === 'warning') {
          const line = `${p.entry.level}/${p.entry.source}: ${p.entry.text}${p.entry.url ? ` (${p.entry.url})` : ''}`;
          // The COEP liveness probe blocks one image ON PURPOSE and asserts the
          // outcome itself; its console line is the evidence, not a defect. Narrow by
          // ORIGIN — anything the page itself loads still lands in logEntries.
          if (p.entry.url && p.entry.url.startsWith(sentinel.base)) coepEvidence.push(line);
          else logEntries.push(line);
        }
        break;
      case 'Network.requestWillBeSent':
        requests.set(p.requestId, p.request.url);
        break;
      case 'Network.responseReceived':
        responses.push({ url: p.response.url, type: p.type, headers: p.response.headers });
        break;
      case 'Network.loadingFailed': {
        const url = requests.get(p.requestId) ?? String(p.requestId);
        const line = `${url}: ${p.errorText}${p.blockedReason ? ` [blocked: ${p.blockedReason}]` : ''}`;
        // es-module-shims revokes each blob: URL it minted once the module has
        // been instantiated, and Chrome reports the already-satisfied fetch as
        // net::ERR_ABORTED. MEASURED as policy-independent: the SAME two aborts
        // appear with the Content-Security-Policy header deleted entirely, so
        // they are the loader's own bookkeeping and not something a header
        // blocked. The exemption is deliberately narrow — a blob: abort ONLY,
        // with no blockedReason. Anything a policy actually blocks arrives with
        // a blockedReason (csp / coep / corp) and still fails this guard.
        if (url.startsWith('blob:') && p.errorText === 'net::ERR_ABORTED' && !p.blockedReason) {
          benign.push(line);
        } else if (url.startsWith(sentinel.base)) {
          // The COEP liveness probe below fetches this on purpose and asserts the
          // outcome itself; it is not a resource the page needs.
          benign.push(line);
        } else {
          failed.push(line);
        }
        break;
      }
      default: break;
    }
  });

  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Log.enable', {}, sessionId);
  await cdp.send('Network.enable', {}, sessionId);
  await cdp.send('Page.enable', {}, sessionId);

  const loaded = new Promise((res) => {
    cdp.on((m) => { if (m.sessionId === sessionId && m.method === 'Page.loadEventFired') res(); });
  });
  await cdp.send('Page.navigate', { url: `${origin.base}/` }, sessionId);
  await Promise.race([loaded, new Promise((r) => setTimeout(r, 30000))]);
  // Angular bootstraps through initFederation() + a dynamic import; give the
  // router a beat to render before sampling the DOM.
  await new Promise((r) => setTimeout(r, 2500));

  const domRes = await cdp.send('Runtime.evaluate', {
    expression: `JSON.stringify({
      root: (document.querySelector('hug-service-catalog-root')||{}).innerHTML ? document.querySelector('hug-service-catalog-root').innerHTML.length : 0,
      outlet: !!document.querySelector('router-outlet'),
      text: (document.body.innerText||'').trim().slice(0, 200),
      href: location.href,
      styled: getComputedStyle(document.body).backgroundColor,
      // The nonce contract, observed rather than assumed: exactly ONE nonce per
      // nonceable element, all of them the SAME value, the ngCspNonce marker resolved
      // on the root element, and the deferred stylesheet actually promoted to
      // media="all". A second nonce attribute on any tag is a duplicate-attribute
      // parse error, which makes CSP treat the element as "Not Nonceable" — the tag
      // looks perfect in view-source and is blocked anyway.
      // el.nonce, NOT getAttribute('nonce'): the HTML parser moves a nonce into an
      // internal slot and BLANKS the content attribute (anti-exfiltration), so the
      // attribute reads '' on every correctly-nonced element.
      nonces: [...new Set([...document.querySelectorAll('[nonce]')].map((e) => e.nonce || e.getAttribute('nonce')))],
      nonced: document.querySelectorAll('[nonce]').length,
      rootNonce: (document.querySelector('hug-service-catalog-root')||{}).getAttribute
        ? document.querySelector('hug-service-catalog-root').getAttribute('ngcspnonce') : null,
      markers: document.documentElement.outerHTML.includes('__HUG_CSP_NONCE__'),
      deferredSheets: [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => l.media),
      pendingCspMedia: document.querySelectorAll('link[ngcspmedia]').length,
      sheetsApplied: [...document.styleSheets].filter((s) => { try { return s.cssRules.length > 0; } catch { return false; } }).length,
    })`,
    returnByValue: true,
  }, sessionId);
  const dom = JSON.parse(domRes.result.value);

  // ── are the policies LIVE, or just present in the header? ──────────────────
  // A header that arrived is not a header the browser is enforcing. Permissions-Policy
  // is read back through the document's own policy object; COEP is measured by loading
  // a cross-origin image with and without CORP off the sentinel origin.
  const liveRes = await cdp.send('Runtime.evaluate', {
    expression: `(async () => {
      const pp = document.featurePolicy || document.permissionsPolicy;
      const img = (url) => new Promise((r) => {
        const i = new Image();
        i.onload = () => r('loaded'); i.onerror = () => r('blocked');
        i.src = url;
      });
      return JSON.stringify({
        ppKnown: !!pp,
        camera: pp ? pp.allowsFeature('camera') : null,
        geolocation: pp ? pp.allowsFeature('geolocation') : null,
        microphone: pp ? pp.allowsFeature('microphone') : null,
        noCorp: ${coepProbe} ? await img(${JSON.stringify(sentinel.base)} + '/plain.png?' + Math.random()) : 'not-measured',
        withCorp: ${coepProbe} ? await img(${JSON.stringify(sentinel.base)} + '/corp.png?' + Math.random()) : 'not-measured',
      });
    })()`,
    awaitPromise: true,
    returnByValue: true,
  }, sessionId);
  const live = JSON.parse(liveRes.result.value);

  const doc = responses.find((r) => r.type === 'Document');
  const problems = [];

  // 1. every header the conf declares for the document location actually arrived
  if (!doc) problems.push('no Document response was observed at all');
  else {
    for (const [name, value] of docHeaders) {
      if (name === 'Access-Control-Allow-Origin') continue; // CORS, not a browser policy
      const got = doc.headers[name] ?? doc.headers[name.toLowerCase()];
      if (got === undefined) { problems.push(`document response is MISSING ${name}`); continue; }
      const expect = value.replaceAll('$cspnonce', '<nonce>');
      const norm = got.replace(/nonce-[0-9a-f]{16,}/g, 'nonce-<nonce>');
      if (norm !== expect.replace(/nonce-<nonce>/g, 'nonce-<nonce>')) {
        problems.push(`document ${name}\n      conf says: ${expect}\n      browser saw: ${norm}`);
      }
    }
  }
  // 2. nothing was blocked
  if (failed.length) problems.push(`${failed.length} request(s) failed/blocked:\n      ${failed.join('\n      ')}`);
  // 3. clean console
  if (logEntries.length) problems.push(`${logEntries.length} browser log entr(ies):\n      ${logEntries.join('\n      ')}`);
  if (consoleErrors.length) problems.push(`${consoleErrors.length} console error/warning(s):\n      ${consoleErrors.join('\n      ')}`);
  if (exceptions.length) problems.push(`${exceptions.length} uncaught exception(s):\n      ${exceptions.join('\n      ')}`);
  // 4. the app is actually on screen (a blank 200 is THE failure mode here)
  if (!dom.outlet || dom.root < 200) {
    problems.push(`the app did not render — <hug-service-catalog-root> innerHTML=${dom.root} bytes, router-outlet=${dom.outlet}. ` +
                  `A blank page at HTTP 200 is exactly what a policy that starves the module loader looks like.`);
  }
  // 5. the nonce contract survived the rewrite
  if (dom.markers) problems.push('the served HTML still contains the literal __HUG_CSP_NONCE__ marker — a sub_filter did not fire.');
  if (dom.nonced < 3) problems.push(`only ${dom.nonced} nonced element(s) in the DOM — the '<script' sub_filter did not reach them.`);
  if (dom.nonces.length !== 1) problems.push(`${dom.nonces.length} distinct nonce values in the DOM (expected 1): ${JSON.stringify(dom.nonces)}. More than one means a tag carries a duplicate nonce attribute, which CSP treats as NOT nonceable.`);
  if (dom.rootNonce !== dom.nonces[0]) problems.push(`the root element's ngCspNonce (${dom.rootNonce}) is not the response nonce (${dom.nonces[0]}) — Angular's runtime styles would carry the wrong value.`);
  if (dom.pendingCspMedia > 0 || dom.deferredSheets.some((m) => m === 'print')) {
    problems.push(`the deferred stylesheet never applied (media=${JSON.stringify(dom.deferredSheets)}, ${dom.pendingCspMedia} link(s) still carrying ngCspMedia). ` +
                  `That is the CSP-safe critical-CSS path failing — the page renders, unstyled, at HTTP 200.`);
  }
  if (dom.sheetsApplied < 2) problems.push(`only ${dom.sheetsApplied} stylesheet(s) have rules — the component/global styles did not load.`);
  // 6. the policies are ENFORCED, not merely present
  if (!live.ppKnown) problems.push('this browser exposes no featurePolicy/permissionsPolicy object — cannot prove Permissions-Policy is live, so refusing to claim it.');
  for (const f of ['camera', 'geolocation', 'microphone']) {
    if (live[f] !== false) problems.push(`Permissions-Policy is not being enforced: allowsFeature('${f}') = ${live[f]} (expected false).`);
  }
  if (coepProbe) {
    if (live.noCorp !== 'blocked') {
      problems.push(`COEP is NOT live: a cross-origin image with no Cross-Origin-Resource-Policy ${live.noCorp} instead of being blocked. ` +
                    `The require-corp header is arriving and doing nothing.`);
    }
    if (live.withCorp !== 'loaded') {
      problems.push(`the COEP probe is not measuring what it claims: the cross-origin image that DOES carry ` +
                    `Cross-Origin-Resource-Policy: cross-origin also ${live.withCorp}, so the block above is not attributable to COEP.`);
    }
    if (!coepEvidence.some((l) => l.includes('Coep'))) {
      problems.push('the blocked sentinel image produced no COEP console entry — the block is not attributable to COEP.');
    }
  }

  console.log(`verify-served-page: mode=${mode} origin=${origin.base} url=${dom.href}`);
  console.log(`verify-served-page: ${responses.length} response(s), root innerHTML ${dom.root} bytes, router-outlet=${dom.outlet}, body background=${dom.styled}`);
  console.log(`verify-served-page: first paint text: ${JSON.stringify(dom.text.slice(0, 120))}`);
  console.log(`verify-served-page: nonce contract: ${dom.nonced} nonced element(s), ${dom.nonces.length} distinct value, root ngCspNonce ${dom.rootNonce === dom.nonces[0] ? 'matches' : 'MISMATCH'}, stylesheets media=${JSON.stringify(dom.deferredSheets)}, ${dom.sheetsApplied} sheet(s) with rules`);
  console.log(`verify-served-page: policy liveness: camera=${live.camera} geolocation=${live.geolocation} microphone=${live.microphone} (all must be false)`);
  if (coepProbe) {
    console.log(`verify-served-page: COEP enforcement: cross-origin https image WITHOUT CORP ${live.noCorp}, the same image WITH Cross-Origin-Resource-Policy: cross-origin ${live.withCorp}`);
    for (const l of coepEvidence) console.log(`verify-served-page:   evidence: ${l}`);
  } else {
    console.log('verify-served-page: COEP enforcement NOT MEASURED (--no-coep-probe) — the header was asserted present, nothing more.');
  }
  if (benign.length) console.log(`verify-served-page: ${benign.length} policy-independent blob: abort(s) (es-module-shims revoking its own URLs — measured identical with no CSP at all)`);
  if (doc) {
    for (const name of [...docHeaders.keys()]) {
      const got = doc.headers[name] ?? doc.headers[name.toLowerCase()];
      console.log(`verify-served-page:   ${name}: ${got}`);
    }
  }

  cleanup();
  process.removeAllListeners('exit');
  if (problems.length) {
    console.error(`verify-served-page: FAIL — ${problems.length} problem(s):`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log('verify-served-page: OK — page rendered, every declared header arrived, nothing blocked, console clean.');
  process.exit(0);
}

main().catch((e) => die(e.stack ?? String(e)));

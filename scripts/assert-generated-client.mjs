#!/usr/bin/env node
/**
 * GUARD: the committed typed client under `src/app/api/` is EXACTLY what `ng-openapi-gen`
 * produces from the committed `openapi.json`, and nothing else (issue #19).
 *
 * WHY `npm run gen` CANNOT SHOW THIS. `ng-openapi-gen` syncs its output into `src/app/api/`
 * and only prunes stale FILES inside directories it emitted itself (`syncDirs` in
 * lib/gen-utils.js). A whole directory it no longer emits (`fn/mfa-challenge-controller/`,
 * `fn/mfa-enrollment-controller/`) is never visited, so a regeneration over the committed tree
 * leaves the orphans in place and `git status` stays clean. Only generating into an EMPTY
 * directory exposes them, which is what this script does.
 *
 * HOW. It runs the generator into a fresh temporary directory (the CLI's `-o` overrides the
 * `output` in ng-openapi-gen.json; every other option still comes from that file), then
 * compares that tree with `src/app/api/` byte for byte: files only in the committed tree
 * (orphans), files only in the generated tree (client not regenerated), and files whose bytes
 * differ. It never writes to the working tree, so it is safe on a dirty checkout.
 *
 * It checks the client against the committed `openapi.json`. Whether that spec is the BFF's
 * current spec is a different question and not asked here.
 *
 * Exit 0 = identical; exit 1 = drift (the differences are listed); exit 2 = could not run.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const COMMITTED = join(root, 'src', 'app', 'api');

/** Every file under `dir`, as sorted POSIX-style paths relative to `dir`. */
function listFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else out.push(relative(dir, p).split('\\').join('/'));
    }
  };
  if (existsSync(dir)) walk(dir);
  return out.sort();
}

const bin = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'ng-openapi-gen.cmd' : 'ng-openapi-gen');
if (!existsSync(bin)) {
  console.error(`verify:client could not run: ${bin} is missing (run npm ci).`);
  process.exit(2);
}

const scratch = mkdtempSync(join(tmpdir(), 'ng-openapi-gen-'));
const generated = join(scratch, 'api');
let status = 0;
try {
  try {
    execFileSync(bin, ['-o', generated, '--silent', 'true'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    console.error(`verify:client could not run ng-openapi-gen:\n${e.stderr || e.message}`);
    process.exit(2);
  }
  const want = listFiles(generated);
  const have = listFiles(COMMITTED);
  if (want.length === 0) {
    console.error('verify:client: the generator wrote no files; refusing to compare against nothing.');
    process.exit(2);
  }
  const wantSet = new Set(want);
  const haveSet = new Set(have);
  const orphans = have.filter((f) => !wantSet.has(f));
  const missing = want.filter((f) => !haveSet.has(f));
  const changed = want.filter((f) => haveSet.has(f) && !readFileSync(join(generated, f)).equals(readFileSync(join(COMMITTED, f))));

  if (orphans.length || missing.length || changed.length) {
    const show = (title, list) => list.length && console.error(`  ${title} (${list.length}):\n${list.map((f) => `    src/app/api/${f}`).join('\n')}`);
    console.error('verify:client FAILED: src/app/api/ is not the generator\'s output for openapi.json.');
    show('committed but not generated (orphans: delete them)', orphans);
    show('generated but not committed (run `npm run gen` and commit)', missing);
    show('content differs (run `npm run gen` and commit)', changed);
    status = 1;
  } else {
    console.log(`verify:client OK: src/app/api/ matches the generator output exactly (${want.length} files).`);
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
process.exit(status);

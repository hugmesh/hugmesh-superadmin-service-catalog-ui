#!/usr/bin/env node
/**
 * THE CROSS-REPO DRIFT GUARD for the OpenAPI spec mirror (issue #20 here).
 *
 * `openapi.json` is not an authored file. It is a COPY of the spec that hugmesh-admin-bff-api
 * commits at `src/main/resources/openapi/openapi.json` (dumped by its OpenApiSpecDumpTest), and
 * the whole typed client under `src/app/api/` is generated from it by `npm run gen:spec`.
 *
 * Nothing used to compare the copy with its source. `tsc`, `verify:schema` and the karma suite
 * all read only THIS repo's bytes, so a stale mirror kept every one of them green: measured on
 * 2026-09-23, with `openapi.json` swapped back to an older copy all three still exited 0. The
 * drift is not hypothetical either - admin-bff-api #104 added `POST /bff/internal/usage` and
 * `RecordUsageRequest` after this mirror was last synced, and nothing reported it.
 *
 * WHAT THIS CHECKS. When the BFF's committed spec is readable, the two files are compared BYTE
 * FOR BYTE. There is deliberately NO local sha256 literal here (the schema guard next door has
 * one): a literal can only prove this repo agrees with itself, and the spec changes whenever
 * ANY BFF controller does, so a literal would turn every re-sync into a second edit that checks
 * nothing. The only comparison that matters is the one against the other repo.
 *
 * WHAT IT DOES NOT CHECK. It does not check that `src/app/api/` was regenerated from
 * `openapi.json`. A mirror that matches the BFF while the generated client was left stale still
 * passes. After a re-sync run `npm run gen:spec` and commit everything it touches.
 *
 * WHERE THE BFF COMES FROM. `$ADMIN_BFF_SPEC` if set, otherwise the sibling checkout
 * `../hugmesh-admin-bff-api/src/main/resources/openapi/openapi.json` - the same convention as
 * `gen:spec`. `HUGMESH_SCHEMA_MIRROR_REQUIRED=1` (the flag `verify:schema` already uses; CI sets
 * it) makes an unreadable BFF spec a FAILURE instead of a skip, so a failed clone cannot turn
 * the guard into a silent no-op. Without the flag, an unreadable spec prints "NOT VERIFIED"
 * and exits 0: on this run the contract is UNCHECKED, which is a real gap, not a formality.
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

/** Where the BFF keeps its committed spec, relative to that repo's root. */
const SPEC_RELATIVE = 'src/main/resources/openapi/openapi.json';

/** The BFF checkout, assumed to be a sibling of this one - same convention as gen:spec's ADMIN_BFF_SPEC. */
const DEFAULT_SIBLING = join('..', 'hugmesh-admin-bff-api', SPEC_RELATIVE);

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const file = join(repoRoot, 'openapi.json');

const mirrorRequired = process.env.HUGMESH_SCHEMA_MIRROR_REQUIRED === '1';
const mirrorPath = process.env.ADMIN_BFF_SPEC
  ? resolve(process.env.ADMIN_BFF_SPEC)
  : resolve(repoRoot, DEFAULT_SIBLING);

const sha = (buf) => createHash('sha256').update(buf).digest('hex');

/** `METHOD /path` for every operation, and the component schema names; null when not parseable. */
function surface(buf) {
  try {
    const doc = JSON.parse(buf.toString('utf8'));
    const ops = new Set();
    for (const [p, item] of Object.entries(doc.paths ?? {})) {
      for (const m of Object.keys(item ?? {})) {
        if (['get', 'put', 'post', 'delete', 'patch', 'head', 'options', 'trace'].includes(m)) {
          ops.add(m.toUpperCase() + ' ' + p);
        }
      }
    }
    return { ops, schemas: new Set(Object.keys(doc.components?.schemas ?? {})) };
  } catch {
    return null;
  }
}

const missing = (from, to) => [...from].filter((x) => !to.has(x)).sort();

const bytes = readFileSync(file);
const actual = sha(bytes);

let mirrorBytes = null;
try {
  // A missing path and a directory both throw here (ENOENT / EISDIR): either way, not read.
  mirrorBytes = readFileSync(mirrorPath);
} catch {
  mirrorBytes = null;
}

if (mirrorBytes === null) {
  const lines = [
    'spec mirror NOT VERIFIED - the BFF spec was not read on this run.',
    '  looked for: ' + mirrorPath,
    '',
    'Nothing else in this repo can see a stale openapi.json: tsc, verify:schema and the karma',
    'suite all read only our own bytes. Until the BFF spec is compared, the generated client may',
    'be describing endpoints the server no longer has, or missing ones it gained.',
    '',
    'To check it, make the BFF readable and re-run:',
    '  - check hugmesh-admin-bff-api out beside this repo, or',
    '  - set ADMIN_BFF_SPEC=<bff>/' + SPEC_RELATIVE,
  ];
  if (mirrorRequired) {
    console.error(lines.join('\n'));
    console.error('');
    console.error('HUGMESH_SCHEMA_MIRROR_REQUIRED=1 is set (CI), so an unverified mirror is a FAILURE:');
    console.error('the clone that provides it must have failed. Fix the clone - do not unset the flag.');
    process.exit(1);
  }
  console.warn(lines.join('\n'));
  console.log('');
  console.log('spec pin NOT VERIFIED (LOCAL ONLY): openapi.json sha256 ' + actual);
  process.exit(0);
}

if (!mirrorBytes.equals(bytes)) {
  let at = 0;
  const max = Math.min(bytes.length, mirrorBytes.length);
  while (at < max && bytes[at] === mirrorBytes[at]) at++;
  const line = bytes.subarray(0, at).toString('utf8').split('\n').length;

  console.error('spec mirror FAILED: openapi.json has DRIFTED from the BFF spec.');
  console.error('  here  openapi.json');
  console.error('        sha256 ' + actual + '  (' + bytes.length + ' bytes)');
  console.error('  there ' + mirrorPath);
  console.error('        sha256 ' + sha(mirrorBytes) + '  (' + mirrorBytes.length + ' bytes)');
  console.error('  first difference at byte ' + at + ' (line ' + line + ')');

  const ours = surface(bytes);
  const theirs = surface(mirrorBytes);
  if (ours && theirs) {
    const rows = [
      ['operations only in the BFF (we lack them)', missing(theirs.ops, ours.ops)],
      ['operations only here (the BFF dropped them)', missing(ours.ops, theirs.ops)],
      ['schemas only in the BFF (we lack them)', missing(theirs.schemas, ours.schemas)],
      ['schemas only here (the BFF dropped them)', missing(ours.schemas, theirs.schemas)],
    ];
    for (const [label, list] of rows) {
      if (list.length === 0) continue;
      console.error('  ' + label + ': ' + list.length);
      for (const x of list.slice(0, 15)) console.error('    ' + x);
      if (list.length > 15) console.error('    ... and ' + (list.length - 15) + ' more');
    }
  }
  console.error('');
  console.error('The generated client under src/app/api/ was produced from this stale copy, so it');
  console.error('no longer matches the server. Fix: re-sync and regenerate in one change, then commit');
  console.error('everything it touches (new files under src/app/api/ included):');
  console.error('  ADMIN_BFF_SPEC=' + mirrorPath + ' npm run gen:spec');
  process.exit(1);
}

console.log('spec pin OK: openapi.json sha256 ' + actual);
console.log('  mirror VERIFIED byte-for-byte against ' + mirrorPath);

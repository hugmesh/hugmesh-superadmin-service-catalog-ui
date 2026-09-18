#!/usr/bin/env node
/**
 * THE CROSS-REPO DRIFT GUARD for the app-profile schema (operator decision 37,
 * hugmesh-generator#347 comment 5722264043; issue #3 here, hugmesh-admin-bff-api#55 there).
 *
 * `schemas/app-profile.schema.json` is not a private file any more: the BFF commits a
 * BYTE-IDENTICAL copy at `src/main/resources/schema/app-profile.schema.json` and validates
 * saves against it, so the two halves refuse exactly the same bodies. The moment either copy
 * is edited on its own the halves disagree silently — a body the console accepts is stored
 * and later refused, or worse, the reverse.
 *
 * TWO CHECKS, AND THEY CATCH DIFFERENT THINGS. Read this before trusting either.
 *
 *   1. THE LOCAL PIN. This file's `PINNED` sha256 is compared against OUR OWN bytes. It makes
 *      editing the schema a deliberate act — you cannot change it without also moving a
 *      literal — but on its own it proves NOTHING about the other repo. Moving the schema and
 *      the literal together in ONE repo satisfies the local pin in that repo completely. That
 *      was the whole hole in the first version of this guard: both repos pinned the same
 *      literal against their own copy, neither ever read the other's file, so a one-sided edit
 *      (widen `certs.ttl` maxLength 32 -> 64 here, move `PINNED` here, touch nothing there)
 *      left BOTH suites green with the copies diverged — measured, exit 0, while `cmp` said
 *      `differ: char 4898, line 63`. Worse, the old script PRINTED "mirrored byte-for-byte by
 *      ..." while it was not true, because it had never looked.
 *
 *   2. THE MIRROR CHECK. When the BFF checkout is reachable, the two files are compared BYTE
 *      FOR BYTE. This is the check that actually enforces the contract, and it is the only one
 *      that can see a one-sided edit. It runs whenever the BFF is checked out beside this repo
 *      (any developer box) and in CI, where .gitlab-ci.yml clones the BFF for exactly this
 *      reason and sets HUGMESH_SCHEMA_MIRROR_REQUIRED=1 so a failed clone cannot skip it.
 *
 * SO: when this script prints "mirror VERIFIED" the copies really were compared. When it
 * prints "mirror NOT VERIFIED" it is telling you the contract is UNCHECKED on this run — that
 * is a real gap, not a formality, and it is why CI makes the check mandatory. Never restate
 * the guarantee as "editing the schema turns both suites red"; it does so only where the
 * mirror check runs.
 *
 * WHY A NODE SCRIPT AND NOT A KARMA SPEC. The specs see the schema through a TypeScript
 * `import ... from '.json'`, i.e. a PARSED object — re-serialising it cannot reproduce the
 * file's bytes (key order survives, but whitespace, escaping and the trailing newline do
 * not), and a hash over a re-serialisation would not be the hash the BFF pins. This reads
 * the file.
 */
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

/**
 * The pinned sha256 of BOTH copies. Moving it is a deliberate, two-repo contract change.
 * The trailing marker is load-bearing: it is how a human grepping either repo finds both
 * literals in one search. The BFF's is AppProfileSchemaMirrorTest.PINNED_SHA256.
 */
const PINNED = '12c581265335a2f91808841c66db546bbd222375392e0d8c23270d82619e8969'; // HUGMESH-SCHEMA-PIN

/** Where the BFF keeps its byte-identical copy, relative to that repo's root. */
const MIRROR_RELATIVE = 'src/main/resources/schema/app-profile.schema.json';

/** The BFF checkout, assumed to be a sibling of this one — same convention as gen:spec's ADMIN_BFF_SPEC. */
const DEFAULT_SIBLING = join('..', 'hugmesh-admin-bff-api', MIRROR_RELATIVE);

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const file = join(repoRoot, 'schemas', 'app-profile.schema.json');

/** CI sets this so an absent mirror is a FAILURE, never a silent skip. */
const mirrorRequired = process.env.HUGMESH_SCHEMA_MIRROR_REQUIRED === '1';
const mirrorPath = process.env.ADMIN_BFF_SCHEMA
  ? resolve(process.env.ADMIN_BFF_SCHEMA)
  : resolve(repoRoot, DEFAULT_SIBLING);

const bytes = readFileSync(file);
const actual = createHash('sha256').update(bytes).digest('hex');

// -- 1. the local pin ---------------------------------------------------------
if (actual !== PINNED) {
  console.error('schema pin FAILED: schemas/app-profile.schema.json has changed.');
  console.error('  expected sha256 ' + PINNED);
  console.error('  actual   sha256 ' + actual);
  console.error('');
  console.error('The BFF commits a byte-identical copy (hugmesh-admin-bff-api ' + MIRROR_RELATIVE + ')');
  console.error('and validates every app-profile save against it. A one-sided edit makes the');
  console.error('console and the server refuse different bodies.');
  console.error('');
  console.error('To change the schema on purpose, in ONE change:');
  console.error('  1. edit schemas/app-profile.schema.json here;');
  console.error('  2. copy it byte-identically over ' + MIRROR_RELATIVE + ' in hugmesh-admin-bff-api;');
  console.error('  3. update PINNED in scripts/assert-schema-pin.mjs AND');
  console.error('     AppProfileSchemaMirrorTest.PINNED_SHA256 in hugmesh-admin-bff-api to ' + actual + ';');
  console.error('  4. run both suites, with both checkouts present so the mirror check below runs.');
  process.exit(1);
}

// -- 2. the mirror check: the half that actually enforces the contract --------
let mirrorBytes = null;
try {
  if (statSync(mirrorPath).isFile()) {
    mirrorBytes = readFileSync(mirrorPath);
  }
} catch {
  mirrorBytes = null;
}

if (mirrorBytes === null) {
  const lines = [
    'schema mirror NOT VERIFIED - the BFF copy was not read on this run.',
    '  looked for: ' + mirrorPath,
    '',
    'The local sha256 pin passed, but it only proves THIS repo is self-consistent. It cannot',
    'see a one-sided edit: moving the schema and PINNED together here satisfies it completely',
    'while hugmesh-admin-bff-api still validates saves against the OLD bytes.',
    '',
    'To check it, make the BFF readable and re-run:',
    '  - check hugmesh-admin-bff-api out beside this repo, or',
    '  - set ADMIN_BFF_SCHEMA=<bff>/' + MIRROR_RELATIVE,
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
  console.log('schema pin OK (LOCAL ONLY): schemas/app-profile.schema.json sha256 ' + actual);
  process.exit(0);
}

if (!mirrorBytes.equals(bytes)) {
  const mirrorHash = createHash('sha256').update(mirrorBytes).digest('hex');
  let at = 0;
  const max = Math.min(bytes.length, mirrorBytes.length);
  while (at < max && bytes[at] === mirrorBytes[at]) at++;
  const line = bytes.subarray(0, at).toString('utf8').split('\n').length;

  console.error('schema mirror FAILED: the two copies have DRIFTED.');
  console.error('  here  schemas/app-profile.schema.json');
  console.error('        sha256 ' + actual + '  (' + bytes.length + ' bytes)');
  console.error('  there ' + mirrorPath);
  console.error('        sha256 ' + mirrorHash + '  (' + mirrorBytes.length + ' bytes)');
  console.error('  first difference at byte ' + at + ' (line ' + line + ')');
  console.error('');
  console.error('The console and the server are now validating app-profile JSON against DIFFERENT');
  console.error('schemas: one of them accepts a body the other refuses. This is the exact failure');
  console.error('the byte-identical copy exists to prevent, and the local sha256 pin cannot see it -');
  console.error('that is why this check reads the other repo instead of trusting a literal.');
  console.error('');
  console.error('Fix it in ONE change: make the two files identical, then set PINNED here and');
  console.error('AppProfileSchemaMirrorTest.PINNED_SHA256 there to the same hash, and run both suites.');
  process.exit(1);
}

console.log('schema pin OK: schemas/app-profile.schema.json sha256 ' + actual);
console.log('  mirror VERIFIED byte-for-byte against ' + mirrorPath);

#!/usr/bin/env node
/**
 * THE CROSS-REPO DRIFT PIN for the app-profile schema (operator decision 37,
 * hugmesh-generator#347 comment 5722264043; issue #3 here, hugmesh-admin-bff-api#55 there).
 *
 * `schemas/app-profile.schema.json` is not a private file any more: the BFF commits a
 * BYTE-IDENTICAL copy at `src/main/resources/schema/app-profile.schema.json` and validates
 * saves against it, so the two halves refuse exactly the same bodies. The moment either copy
 * is edited on its own the halves disagree silently — a body the console accepts is stored
 * and later refused, or worse, the reverse.
 *
 * So BOTH copies are pinned to the SAME sha256 literal, in a test on each side:
 *   here                     scripts/assert-schema-pin.mjs   (this file, run by `npm test`)
 *   hugmesh-admin-bff-api    AppProfileSchemaMirrorTest      (`./mvnw -Dtest=AppProfileSchemaMirrorTest test`)
 *
 * Editing the schema therefore turns BOTH suites red until both copies AND both pins move in
 * the same change. That is the point: the pin is not here to bless the current bytes, it is
 * here to make a one-sided edit impossible to land quietly.
 *
 * WHY A NODE SCRIPT AND NOT A KARMA SPEC. The specs see the schema through a TypeScript
 * `import ... from '.json'`, i.e. a PARSED object — re-serialising it cannot reproduce the
 * file's bytes (key order survives, but whitespace, escaping and the trailing newline do
 * not), and a hash over a re-serialisation would not be the hash the BFF pins. This reads
 * the file.
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/** The pinned sha256 of BOTH copies. Moving it is a deliberate, two-repo contract change. */
const PINNED = '12c581265335a2f91808841c66db546bbd222375392e0d8c23270d82619e8969';

/** Where the BFF keeps its byte-identical copy — named so a failure says where to look. */
const MIRROR = 'hugmesh-admin-bff-api src/main/resources/schema/app-profile.schema.json';

const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, '..', 'schemas', 'app-profile.schema.json');

const bytes = readFileSync(file);
const actual = createHash('sha256').update(bytes).digest('hex');

if (actual !== PINNED) {
  console.error('schema pin FAILED: schemas/app-profile.schema.json has changed.');
  console.error('  expected sha256 ' + PINNED);
  console.error('  actual   sha256 ' + actual);
  console.error('');
  console.error('This file is mirrored byte-for-byte by the BFF (' + MIRROR + '),');
  console.error('which validates every app-profile save against it. A one-sided edit makes the');
  console.error('console and the server refuse different bodies.');
  console.error('');
  console.error('To change the schema on purpose, in ONE change:');
  console.error('  1. edit schemas/app-profile.schema.json here;');
  console.error('  2. copy it byte-identically over ' + MIRROR + ';');
  console.error('  3. update PINNED in scripts/assert-schema-pin.mjs AND');
  console.error('     AppProfileSchemaMirrorTest.PINNED_SHA256 in hugmesh-admin-bff-api to ' + actual + ';');
  console.error('  4. run both suites.');
  process.exit(1);
}

console.log('schema pin OK: schemas/app-profile.schema.json sha256 ' + actual);
console.log('  mirrored byte-for-byte by ' + MIRROR);

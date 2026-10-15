/**
 * Tests for scripts/assert-spec-pin.mjs (issue #20). Run with `npm run test:scripts`.
 *
 * The guard locates openapi.json from its OWN path, so each case copies the script into a
 * throwaway repo layout and runs that copy against synthetic specs. The real openapi.json is
 * never touched. Every case here must go RED if the matching line of the guard is broken - see
 * the mutation list in the pull request that added this file.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'assert-spec-pin.mjs');
const SPEC_RELATIVE = 'src/main/resources/openapi/openapi.json';

const spec = (extra = {}) =>
  JSON.stringify(
    {
      openapi: '3.0.1',
      paths: { '/bff/a': { get: {} }, ...(extra.paths ?? {}) },
      components: { schemas: { A: {}, ...(extra.schemas ?? {}) } },
    },
    null,
    2,
  ) + '\n';

/** A repo layout under a fresh temp dir: <root>/repo/{scripts,openapi.json} and <root>/bff for the BFF. */
function layout(ownSpec) {
  const root = mkdtempSync(join(process.env.TMPDIR || tmpdir(), 'spec-pin-'));
  mkdirSync(join(root, 'repo', 'scripts'), { recursive: true });
  copyFileSync(SCRIPT, join(root, 'repo', 'scripts', 'assert-spec-pin.mjs'));
  writeFileSync(join(root, 'repo', 'openapi.json'), ownSpec);
  return root;
}

function run(root, env = {}) {
  const clean = { ...process.env };
  delete clean.ADMIN_BFF_SPEC;
  delete clean.HUGMESH_SCHEMA_MIRROR_REQUIRED;
  const r = spawnSync(process.execPath, [join(root, 'repo', 'scripts', 'assert-spec-pin.mjs')], {
    env: { ...clean, ...env },
    encoding: 'utf8',
  });
  return { code: r.status, out: r.stdout + r.stderr };
}

function withBff(root, content) {
  const p = join(root, 'bff-spec.json');
  writeFileSync(p, content);
  return p;
}

function cleanup(root) {
  rmSync(root, { recursive: true, force: true });
}

test('identical bytes verify and exit 0', () => {
  const root = layout(spec());
  try {
    const r = run(root, { ADMIN_BFF_SPEC: withBff(root, spec()), HUGMESH_SCHEMA_MIRROR_REQUIRED: '1' });
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /mirror VERIFIED byte-for-byte/);
  } finally {
    cleanup(root);
  }
});

test('a stale mirror (BFF gained an operation and a schema) fails and names both', () => {
  const root = layout(spec());
  try {
    const bff = spec({
      paths: { '/bff/internal/usage': { post: {} } },
      schemas: { RecordUsageRequest: {} },
    });
    const r = run(root, { ADMIN_BFF_SPEC: withBff(root, bff), HUGMESH_SCHEMA_MIRROR_REQUIRED: '1' });
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /spec mirror FAILED/);
    assert.match(r.out, /operations only in the BFF \(we lack them\): 1/);
    assert.match(r.out, /POST \/bff\/internal\/usage/);
    assert.match(r.out, /schemas only in the BFF \(we lack them\): 1/);
    assert.match(r.out, /RecordUsageRequest/);
    assert.match(r.out, /npm run gen:spec/);
  } finally {
    cleanup(root);
  }
});

test('a mirror that kept something the BFF dropped fails and says so', () => {
  const root = layout(spec({ paths: { '/bff/old': { delete: {} } }, schemas: { Old: {} } }));
  try {
    const r = run(root, { ADMIN_BFF_SPEC: withBff(root, spec()) });
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /operations only here \(the BFF dropped them\): 1/);
    assert.match(r.out, /DELETE \/bff\/old/);
    assert.match(r.out, /schemas only here \(the BFF dropped them\): 1/);
  } finally {
    cleanup(root);
  }
});

test('path-item keys that are not operations (parameters, summary) are not listed as operations', () => {
  const root = layout(spec());
  try {
    const bff = spec({ paths: { '/bff/p': { parameters: [], summary: 'x', get: {} } } });
    const r = run(root, { ADMIN_BFF_SPEC: withBff(root, bff) });
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /operations only in the BFF \(we lack them\): 1\n\s+GET \/bff\/p\n/);
    assert.doesNotMatch(r.out, /PARAMETERS|SUMMARY/);
  } finally {
    cleanup(root);
  }
});

test('a whitespace-only difference still fails: the comparison is byte-for-byte', () => {
  const root = layout(spec());
  try {
    const r = run(root, { ADMIN_BFF_SPEC: withBff(root, spec().trimEnd()) });
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /spec mirror FAILED/);
  } finally {
    cleanup(root);
  }
});

test('an unparseable BFF file still fails on the byte compare, without the structural summary', () => {
  const root = layout(spec());
  try {
    const r = run(root, { ADMIN_BFF_SPEC: withBff(root, '{ not json') });
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /spec mirror FAILED/);
    assert.doesNotMatch(r.out, /only in the BFF/);
  } finally {
    cleanup(root);
  }
});

test('an unreadable BFF spec is a FAILURE when the mirror is required', () => {
  const root = layout(spec());
  try {
    const r = run(root, {
      ADMIN_BFF_SPEC: join(root, 'does-not-exist.json'),
      HUGMESH_SCHEMA_MIRROR_REQUIRED: '1',
    });
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /spec mirror NOT VERIFIED/);
    assert.match(r.out, /is a FAILURE/);
  } finally {
    cleanup(root);
  }
});

test('an unreadable BFF spec without the flag warns and exits 0, never claiming VERIFIED', () => {
  const root = layout(spec());
  try {
    const r = run(root, { ADMIN_BFF_SPEC: join(root, 'does-not-exist.json') });
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /spec mirror NOT VERIFIED/);
    assert.doesNotMatch(r.out, /VERIFIED byte-for-byte/);
  } finally {
    cleanup(root);
  }
});

test('a directory where the spec should be counts as unreadable, not as a match', () => {
  const root = layout(spec());
  try {
    mkdirSync(join(root, 'a-directory'));
    const r = run(root, { ADMIN_BFF_SPEC: join(root, 'a-directory'), HUGMESH_SCHEMA_MIRROR_REQUIRED: '1' });
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /NOT VERIFIED/);
  } finally {
    cleanup(root);
  }
});

test('without ADMIN_BFF_SPEC the sibling hugmesh-admin-bff-api checkout is used', () => {
  const root = layout(spec());
  try {
    const dir = join(root, 'hugmesh-admin-bff-api', ...SPEC_RELATIVE.split('/').slice(0, -1));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'openapi.json'), spec());
    let r = run(root, { HUGMESH_SCHEMA_MIRROR_REQUIRED: '1' });
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /mirror VERIFIED byte-for-byte against .*hugmesh-admin-bff-api/);

    writeFileSync(join(dir, 'openapi.json'), spec({ schemas: { Drifted: {} } }));
    r = run(root, { HUGMESH_SCHEMA_MIRROR_REQUIRED: '1' });
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /Drifted/);
  } finally {
    cleanup(root);
  }
});

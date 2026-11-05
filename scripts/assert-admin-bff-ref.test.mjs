/**
 * Tests for scripts/assert-admin-bff-ref.mjs (issue #33). Run with `npm run test:scripts`.
 *
 * Every mutation case starts from this repo's REAL pipeline files and changes one thing, so a
 * case goes red only for the reason it names. The real files are never written.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { check } from './assert-admin-bff-ref.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const real = {
  refFile: readFileSync(join(ROOT, '.admin-bff-ref'), 'utf8'),
  releaseYml: readFileSync(join(ROOT, '.github/workflows/release.yml'), 'utf8'),
  gitlabCi: readFileSync(join(ROOT, '.gitlab-ci.yml'), 'utf8'),
};
const PIN = real.refFile.trim();
const OTHER = 'a'.repeat(40);

/** Replace exactly one occurrence of `from` in `text`, failing the test if it is not there once. */
function swap(text, from, to) {
  const n = text.split(from).length - 1;
  assert.equal(n, 1, 'mutation anchor must appear exactly once: ' + JSON.stringify(from));
  return text.replace(from, to);
}

const failsWith = (files, re) => {
  const { problems } = check({ ...real, ...files });
  assert.ok(problems.length > 0, 'expected the check to fail');
  assert.ok(problems.some((p) => re.test(p)), 'no problem matched ' + re + ':\n' + problems.join('\n'));
};

const GH_REF = 'ref: ${{ steps.admin-bff-ref.outputs.sha }}';
const GL_READ = 'ADMIN_BFF_REF="$(tr -d \'[:space:]\' < "${CI_PROJECT_DIR}/.admin-bff-ref")"';
const GL_FETCH =
  'git -C "${BFF_DIR}" fetch -q --depth 1 "${ORG_BASE}/hugmesh-admin-bff-api.git" "${ADMIN_BFF_REF}"';

test('the committed pipelines and pin pass', () => {
  assert.match(PIN, /^[0-9a-f]{40}$/);
  assert.deepEqual(check(real).problems, []);
});

test('the CLI exits 0 on this repo and names the pin', () => {
  const r = spawnSync(process.execPath, [join(ROOT, 'scripts/assert-admin-bff-ref.mjs')], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, new RegExp('admin-bff pin OK: .* ' + PIN));
});

test('the CLI exits 1 when a pipeline is set back to main', () => {
  const root = mkdtempSync(join(process.env.TMPDIR || tmpdir(), 'bff-ref-'));
  try {
    mkdirSync(join(root, 'scripts'));
    mkdirSync(join(root, '.github/workflows'), { recursive: true });
    copyFileSync(join(ROOT, 'scripts/assert-admin-bff-ref.mjs'), join(root, 'scripts/assert-admin-bff-ref.mjs'));
    writeFileSync(join(root, '.admin-bff-ref'), real.refFile);
    writeFileSync(join(root, '.github/workflows/release.yml'), swap(real.releaseYml, GH_REF, 'ref: main'));
    writeFileSync(join(root, '.gitlab-ci.yml'), real.gitlabCi);
    const r = spawnSync(process.execPath, [join(root, 'scripts/assert-admin-bff-ref.mjs')], { encoding: 'utf8' });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stderr, /admin-bff pin FAILED/);
    assert.match(r.stderr, /release\.yml fetches the BFF at 'main'/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('release.yml checking out main directly fails', () => {
  failsWith({ releaseYml: swap(real.releaseYml, GH_REF, 'ref: main') }, /release\.yml.*'main'/);
});

test('release.yml going back to env ADMIN_BFF_REF: main fails', () => {
  let y = swap(real.releaseYml, GH_REF, 'ref: ${{ env.ADMIN_BFF_REF }}');
  y = swap(y, 'env:\n  IMAGE_NAME:', 'env:\n  ADMIN_BFF_REF: main\n  IMAGE_NAME:');
  failsWith({ releaseYml: y }, /release\.yml resolves the BFF ref to 'main'/);
});

test('release.yml with no ref (default branch) fails', () => {
  failsWith({ releaseYml: swap(real.releaseYml, '          ' + GH_REF + '\n', '') }, /no ref:/);
});

test('release.yml reading a step that does not read .admin-bff-ref fails', () => {
  const y = swap(real.releaseYml, '< app/.admin-bff-ref)', '< app/some-other-file)');
  failsWith({ releaseYml: y }, /does not read \.admin-bff-ref/);
});

test('a stale literal ADMIN_BFF_REF: main left in release.yml fails even if unread', () => {
  const y = swap(real.releaseYml, 'env:\n  IMAGE_NAME:', 'env:\n  ADMIN_BFF_REF: main\n  IMAGE_NAME:');
  failsWith({ releaseYml: y }, /still assigns ADMIN_BFF_REF a literal 'main'/);
});

test('.gitlab-ci.yml going back to git clone --branch main fails', () => {
  let g = swap(real.gitlabCi, '    - ' + GL_READ + '\n', '');
  g = swap(
    g,
    GL_FETCH,
    'git clone --depth 1 --branch "${ADMIN_BFF_REF}" "${ORG_BASE}/hugmesh-admin-bff-api.git" "${BFF_DIR}"',
  );
  g = swap(g, 'test:\n  stage: test\n', 'test:\n  stage: test\n  variables:\n    ADMIN_BFF_REF: "main"\n');
  failsWith({ gitlabCi: g }, /cloned/);
  failsWith({ gitlabCi: g }, /\.gitlab-ci\.yml still assigns ADMIN_BFF_REF a literal 'main'/);
});

test('.gitlab-ci.yml fetching with ADMIN_BFF_REF set to main fails', () => {
  const g = swap(real.gitlabCi, GL_READ, 'ADMIN_BFF_REF=main');
  failsWith({ gitlabCi: g }, /\.gitlab-ci\.yml resolves the BFF ref to 'main'/);
});

test('.gitlab-ci.yml fetching a literal main fails', () => {
  const g = swap(real.gitlabCi, '"${ADMIN_BFF_REF}"\n    - git -C', 'main\n    - git -C');
  failsWith({ gitlabCi: g }, /\.gitlab-ci\.yml fetches the BFF at 'main'/);
});

test('the pipelines disagreeing on a SHA fails', () => {
  const y = swap(real.releaseYml, GH_REF, 'ref: ' + OTHER);
  failsWith({ releaseYml: y }, /disagree/);
});

test('a branch, tag or short SHA in .admin-bff-ref fails', () => {
  for (const bad of ['main\n', 'v0.3.0-beta.1\n', PIN.slice(0, 12) + '\n', PIN.toUpperCase() + '\n', '']) {
    failsWith({ refFile: bad }, /\.admin-bff-ref/);
  }
  failsWith({ refFile: PIN + '\n' + OTHER + '\n' }, /exactly one line/);
});

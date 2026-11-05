#!/usr/bin/env node
/**
 * THE ADMIN-BFF PIN GUARD (issue #33).
 *
 * `verify:schema` and `verify:spec` compare this repo's copies with the files hugmesh-admin-bff-api
 * commits. Both pipelines used to fetch the BFF at `main`, so a tag run compared the release
 * against whatever the BFF's main held when the tag was pushed, not against the spec the release
 * was built from. Tag run 41003786629 (v0.2.0-beta.1) failed that way: a BFF spec commit landed
 * between the merge and the tag push.
 *
 * THE PIN. `.admin-bff-ref` holds one full 40-hex commit SHA of hugmesh-admin-bff-api. It is the
 * only place the value is written. `.github/workflows/release.yml` and `.gitlab-ci.yml` both read
 * that file. It is bumped only in a pull request that also re-syncs `openapi.json` and regenerates
 * the client (`npm run gen:spec`), so the pin, the spec copy and the client move together.
 *
 * WHAT THIS CHECKS. It works out, from the text of each pipeline, which BFF ref that pipeline
 * fetches, and fails when:
 *   - `.admin-bff-ref` is not a full 40-hex SHA (a branch such as `main`, a tag, a short SHA);
 *   - either pipeline fetches anything other than the value in `.admin-bff-ref` (a literal
 *     branch, an env or CI variable holding one, no ref at all, `git clone --branch`);
 *   - the two pipelines resolve to different values;
 *   - either pipeline still assigns a literal ADMIN_BFF_REF that is not the pinned SHA, even if
 *     nothing reads it (a stale `ADMIN_BFF_REF: main` misleads the next reader).
 *
 * WHAT IT DOES NOT CHECK. It reads YAML as text, in the shapes these two files use. It does not
 * prove the SHA exists in the BFF (the pipelines do: each fetch fails on an unknown commit and
 * each one compares the checked-out HEAD with the pin), and it does not prove `openapi.json`
 * matches that commit (`verify:spec` does, in CI, against the fetched files).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

export const REF_FILE = '.admin-bff-ref';
export const BFF_REPO = 'hugmesh-admin-bff-api';
const SHA = /^[0-9a-f]{40}$/;
/** Marker for "this pipeline reads the value from .admin-bff-ref at run time". */
const FROM_FILE = Symbol('from .admin-bff-ref');

/** True when a line READS .admin-bff-ref (a `<` redirect or `cat`), not merely mentions it. */
const readsRefFile = (text) => /(?:<|\bcat\b)\s*["']?[^\s"']*\.admin-bff-ref\b/.test(text);

const unquote = (v) => v.trim().replace(/^(['"])(.*)\1$/, '$2');

/** Every literal `ADMIN_BFF_REF: value` (YAML) or `ADMIN_BFF_REF=value` (shell) in a file. */
function literalAssignments(text) {
  const out = [];
  for (const line of text.split('\n')) {
    if (/^\s*#/.test(line)) continue;
    const yaml = line.match(/^\s*ADMIN_BFF_REF\s*:\s*(.*?)\s*(#.*)?$/);
    if (yaml) out.push(unquote(yaml[1]));
    const sh = line.match(/(?:^|[\s;-])ADMIN_BFF_REF=("[^"]*"|'[^']*'|\S+)/);
    if (sh) out.push(unquote(sh[1]));
  }
  return out;
}

/** The lines of the step (a `- ` list item) that contains line `at`, by indentation. */
function stepAround(lines, at) {
  let start = at;
  while (start > 0 && !/^\s*- /.test(lines[start])) start--;
  const indent = lines[start].match(/^(\s*)-/)[1].length;
  let end = start + 1;
  while (end < lines.length) {
    const l = lines[end];
    if (l.trim() !== '' && !/^\s*#/.test(l)) {
      const ind = l.match(/^(\s*)/)[1].length;
      if (ind < indent || (ind === indent && /^\s*- /.test(l))) break;
    }
    end++;
  }
  return lines.slice(start, end);
}

/** The BFF ref .github/workflows/release.yml checks out: a string, FROM_FILE, or an error. */
export function githubRef(text) {
  const lines = text.split('\n');
  const at = lines.findIndex((l) => new RegExp('^\\s*repository:\\s*["\']?hugmesh/' + BFF_REPO + '["\']?\\s*$').test(l));
  if (at < 0) return { error: 'no actions/checkout step for hugmesh/' + BFF_REPO };
  const step = stepAround(lines, at);
  const refLine = step.find((l) => /^\s*ref:/.test(l));
  if (!refLine) return { error: 'the ' + BFF_REPO + ' checkout has no ref:, so it fetches the default branch' };
  const ref = unquote(refLine.replace(/^\s*ref:\s*/, '').replace(/\s+#.*$/, ''));

  const expr = ref.match(/^\$\{\{\s*(.*?)\s*\}\}$/);
  if (!expr) return { value: ref };
  const fromStep = expr[1].match(/^steps\.([A-Za-z0-9_-]+)\.outputs\.([A-Za-z0-9_-]+)$/);
  if (fromStep) {
    const [, id, key] = fromStep;
    const idAt = lines.findIndex((l) => new RegExp('^\\s*(- )?id:\\s*["\']?' + id + '["\']?\\s*$').test(l));
    if (idAt < 0) return { error: 'ref: reads steps.' + id + ' but no step has id ' + id };
    const body = stepAround(lines, idAt).join('\n');
    if (!readsRefFile(body)) return { error: 'step ' + id + ' does not read ' + REF_FILE };
    if (!new RegExp('\\b' + key + '=').test(body)) return { error: 'step ' + id + ' never writes output ' + key };
    return { value: FROM_FILE };
  }
  const fromEnv = expr[1].match(/^env\.([A-Za-z0-9_]+)$/);
  if (fromEnv) {
    const vals = [];
    for (const l of lines) {
      const m = l.match(new RegExp('^\\s*' + fromEnv[1] + '\\s*:\\s*(.*?)\\s*(#.*)?$'));
      if (m) vals.push(unquote(m[1]));
    }
    if (vals.length !== 1) return { error: 'ref: reads env.' + fromEnv[1] + ', assigned ' + vals.length + ' times' };
    return { value: vals[0] };
  }
  return { error: 'ref: ' + ref + ' cannot be resolved from this file' };
}

/** The BFF ref .gitlab-ci.yml fetches: a string, FROM_FILE, or an error. */
export function gitlabRef(text) {
  const lines = text.split('\n').filter((l) => !/^\s*#/.test(l));
  const uses = lines.filter((l) => l.includes(BFF_REPO + '.git'));
  if (uses.length !== 1) return { error: 'expected one command naming ' + BFF_REPO + '.git, found ' + uses.length };
  const cmd = uses[0];
  if (/\bclone\b/.test(cmd)) {
    return { error: 'the BFF is cloned (git clone takes a branch, never a SHA); fetch the pinned commit instead' };
  }
  if (!/\bfetch\b/.test(cmd)) return { error: 'the line naming ' + BFF_REPO + '.git is not a git fetch' };
  const after = cmd.slice(cmd.indexOf(BFF_REPO + '.git') + (BFF_REPO + '.git').length).replace(/^["']/, '');
  const tok = after.trim().split(/\s+/)[0];
  if (!tok) return { error: 'the BFF fetch names no ref, so it fetches the default branch' };
  const ref = unquote(tok);
  const v = ref.match(/^\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?$/);
  if (!v) return { value: ref };

  // A script line `NAME="$(... .admin-bff-ref)"` sets it at run time and wins over `variables:`.
  const name = v[1];
  const scriptSet = lines.filter((l) => new RegExp('(?:^|[\\s;-])' + name + '=').test(l));
  if (scriptSet.length > 0) {
    const last = scriptSet[scriptSet.length - 1];
    if (readsRefFile(last)) return { value: FROM_FILE };
    const m = last.match(new RegExp(name + '=("[^"]*"|\'[^\']*\'|\\S+)'));
    return { value: unquote(m[1]) };
  }
  const yamlSet = lines
    .map((l) => l.match(new RegExp('^\\s*' + name + '\\s*:\\s*(.*?)\\s*$')))
    .filter(Boolean)
    .map((m) => unquote(m[1]));
  if (yamlSet.length !== 1) return { error: 'the BFF fetch reads $' + name + ', assigned ' + yamlSet.length + ' times' };
  return { value: yamlSet[0] };
}

/** All problems with the pin across the three files; empty means the check passes. */
export function check({ refFile, releaseYml, gitlabCi }) {
  const problems = [];
  const lines = refFile.split('\n').map((l) => l.trim()).filter((l) => l !== '');
  const pin = lines.length === 1 ? lines[0] : null;
  if (pin === null) problems.push(REF_FILE + ' must hold exactly one line, found ' + lines.length);
  else if (!SHA.test(pin)) problems.push(REF_FILE + " holds '" + pin + "': it must be a full 40-hex commit SHA, never a branch or tag");

  const resolved = {};
  for (const [label, text, fn] of [
    ['.github/workflows/release.yml', releaseYml, githubRef],
    ['.gitlab-ci.yml', gitlabCi, gitlabRef],
  ]) {
    for (const lit of literalAssignments(text)) {
      if (/\$/.test(lit)) continue; // a shell or expression read, not a literal
      if (lit !== pin) problems.push(label + " still assigns ADMIN_BFF_REF a literal '" + lit + "'");
    }
    const r = fn(text);
    if (r.error) {
      problems.push(label + ': ' + r.error);
      continue;
    }
    const value = r.value === FROM_FILE ? pin : r.value;
    resolved[label] = value;
    if (r.value !== FROM_FILE) {
      problems.push(label + " fetches the BFF at '" + r.value + "' instead of reading " + REF_FILE);
    }
    if (value !== null && !SHA.test(value)) {
      problems.push(label + " resolves the BFF ref to '" + value + "', which is not a full commit SHA (a branch moves)");
    }
  }
  const vals = Object.values(resolved);
  if (vals.length === 2 && vals[0] !== vals[1]) {
    problems.push("the pipelines disagree: release.yml uses '" + vals[0] + "', .gitlab-ci.yml uses '" + vals[1] + "'");
  }
  return { pin, problems };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const read = (p) => readFileSync(join(root, p), 'utf8');
  let files;
  try {
    files = {
      refFile: read(REF_FILE),
      releaseYml: read('.github/workflows/release.yml'),
      gitlabCi: read('.gitlab-ci.yml'),
    };
  } catch (e) {
    console.error('admin-bff pin FAILED: ' + e.message);
    process.exit(1);
  }
  const { pin, problems } = check(files);
  if (problems.length > 0) {
    console.error('admin-bff pin FAILED:');
    for (const p of problems) console.error('  - ' + p);
    console.error('');
    console.error('Both pipelines must fetch hugmesh-admin-bff-api at the full commit SHA in ' + REF_FILE + '.');
    console.error('Bump that file only in a pull request that also runs `npm run gen:spec` (issue #33).');
    process.exit(1);
  }
  console.log('admin-bff pin OK: both pipelines fetch hugmesh-admin-bff-api at ' + pin + ' (' + REF_FILE + ')');
}

/**
 * Minimal nginx.conf reader shared by the two header guards
 * (`assert-nginx-headers.mjs` pins the values; `verify-served-page.mjs` replays
 * them at a real browser).
 *
 * WHY A PARSER AND NOT A grep. nginx `add_header` does NOT merge across nesting
 * levels: the moment a `location` sets ONE add_header of its own it discards
 * EVERY inherited (server-scope) one. So "is header X in nginx.conf" is the
 * wrong question — the only meaningful question is "which headers does THIS
 * block emit", and answering it needs the block structure. A flat grep reports
 * a header as present when the block that actually serves index.html never
 * emits it, which is precisely the failure this file exists to make impossible.
 *
 * Deliberately NOT a general nginx parser: it understands `{}` nesting, `;`
 * terminated directives, `#` comments and double-quoted arguments, which is the
 * whole of the grammar this repo's conf uses. Anything richer would be untested
 * surface.
 */
import { readFileSync } from 'node:fs';

/** Split a directive line into its arguments, honouring 'single' and "double"
 *  quotes (nginx accepts either, and this conf uses BOTH — single quotes around
 *  the sub_filter patterns, which themselves contain double quotes). */
function splitArgs(text) {
  const args = [];
  let cur = '';
  let quote = null;
  let has = false;
  for (const ch of text) {
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      has = true;
      continue;
    }
    if (/\s/.test(ch)) {
      if (has || cur.length > 0) args.push(cur);
      cur = '';
      has = false;
      continue;
    }
    cur += ch;
  }
  if (has || cur.length > 0) args.push(cur);
  return args;
}

/**
 * @returns {{header: string, directives: {name: string, args: string[]}[], blocks: Block[]}}
 *   a tree of blocks; `header` is the block opener ("server", "location /", …).
 */
function parseBlock(src, state, header) {
  const block = { header, directives: [], blocks: [] };
  let buf = '';
  while (state.i < src.length) {
    const ch = src[state.i];
    if (ch === '#') {
      while (state.i < src.length && src[state.i] !== '\n') state.i += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      // Consume the whole quoted argument verbatim so a ; { } or # inside it is
      // literal text and not mistaken for structure.
      buf += ch;
      state.i += 1;
      while (state.i < src.length && src[state.i] !== ch) {
        buf += src[state.i];
        state.i += 1;
      }
      buf += ch;
      state.i += 1;
      continue;
    }
    if (ch === ';') {
      const args = splitArgs(buf);
      if (args.length > 0) block.directives.push({ name: args[0], args: args.slice(1) });
      buf = '';
      state.i += 1;
      continue;
    }
    if (ch === '{') {
      state.i += 1;
      block.blocks.push(parseBlock(src, state, splitArgs(buf).join(' ')));
      buf = '';
      continue;
    }
    if (ch === '}') {
      state.i += 1;
      return block;
    }
    buf += ch;
    state.i += 1;
  }
  return block;
}

export function parseNginxConf(path) {
  const src = readFileSync(path, 'utf8');
  return parseBlock(src, { i: 0 }, '');
}

/** The `server { … }` block. Throws rather than returning undefined: a conf we
 *  cannot understand must fail the guard, never pass it vacuously. */
export function serverBlock(root) {
  const server = root.blocks.find((b) => b.header === 'server');
  if (!server) throw new Error('nginx.conf has no server { } block — refusing to report on a conf this parser did not understand');
  return server;
}

/** The `location <match> { … }` block, by its exact match expression. */
export function locationBlock(server, match) {
  const loc = server.blocks.find((b) => b.header === `location ${match}`);
  if (!loc) throw new Error(`nginx.conf has no \`location ${match}\` block`);
  return loc;
}

/**
 * The response headers a block ACTUALLY emits, as name -> value.
 *
 * Implements the inheritance rule that makes this file necessary: a block with
 * at least one add_header of its own inherits NOTHING from its parent; a block
 * with none inherits the parent's whole set.
 */
export function emittedHeaders(block, parent) {
  const own = block.directives.filter((d) => d.name === 'add_header');
  const source = own.length > 0 ? own : (parent ? parent.directives.filter((d) => d.name === 'add_header') : []);
  const out = new Map();
  for (const d of source) out.set(d.args[0], d.args[1] ?? '');
  return out;
}

/** True when the block sets its own add_header set (and so inherits none). */
export function shadowsParentHeaders(block) {
  return block.directives.some((d) => d.name === 'add_header');
}

/** `sub_filter '<from>' '<to>'` pairs declared in a block. */
export function subFilters(block) {
  return block.directives
    .filter((d) => d.name === 'sub_filter')
    .map((d) => ({ from: d.args[0] ?? '', to: d.args[1] ?? '' }));
}

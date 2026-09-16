/**
 * The UI half of the app-profile SCHEMA contract (issue #3; operator decision
 * 2026-09-16 "A: define a schema" — named fields validated on save, in the UI and in
 * the bff).
 *
 * <p>The SOURCE OF TRUTH is the committed JSON Schema at
 * {@code schemas/app-profile.schema.json}. This module is a small interpreter for the
 * SUBSET of JSON Schema 2020-12 that file uses — it adds no rule of its own, so:
 * <ul>
 *   <li>loosening the schema loosens the editor (the mutation check in the spec relies
 *       on exactly that), and the bff, mirroring the same file, stays in step;</li>
 *   <li>a keyword the interpreter does not implement is NEVER silently skipped (which
 *       would fail OPEN): {@link SUPPORTED_KEYWORDS} is pinned by the spec, which walks
 *       the schema and fails the moment an unimplemented keyword appears in it;</li>
 *   <li>and the two ways a node could carry NO enforceable rule at all — a subschema with
 *       no {@code type}, or an {@code additionalProperties} that is not a boolean — are
 *       refusals, not silent acceptance ({@link validateAgainstSchema} reports them as
 *       {@code schema error: ...} against the offending path). The spec pins both the
 *       runtime behaviour and, statically, that the committed file never trips them.</li>
 * </ul>
 *
 * <p>Unknown-field rejection is EXPLICIT: every object in the schema carries
 * {@code additionalProperties: false} (also pinned by the spec), and the error names
 * the offending key together with the keys that ARE allowed at that level.
 */
import schemaJson from '../../schemas/app-profile.schema.json';

/** One field-level refusal. {@code path} is dotted from the root ({@code '$'} for the
 *  root itself): {@code resources.cpu}, {@code roles[1]}, {@code exposure.ports[0]}. */
export interface AppProfileFieldError {
  path: string;
  message: string;
}

export type AppProfileValidation =
  | { ok: true; value: Record<string, unknown> }
  /** {@code kind} says whether the text failed to PARSE ({@code 'json'}, a single
   *  {@code '$'} error) or parsed but does not match the schema ({@code 'schema'}). */
  | { ok: false; kind: 'json' | 'schema'; errors: AppProfileFieldError[] };

/** The JSON Schema type names the interpreter understands. */
const TYPES = ['object', 'array', 'string', 'integer', 'number', 'boolean'] as const;
type TypeName = (typeof TYPES)[number];

/** The subset of JSON Schema the interpreter implements. Annotation keywords are listed
 *  so the spec's keyword guard can be exact: anything NOT here is a spec failure. */
export const SUPPORTED_KEYWORDS: ReadonlySet<string> = new Set([
  // annotations (no validation effect; `examples` feeds the hint in a pattern error)
  '$schema', '$id', '$comment', 'title', 'description', 'examples',
  // object
  'type', 'properties', 'additionalProperties', 'required',
  // string
  'pattern', 'minLength', 'maxLength',
  // array
  'items', 'uniqueItems', 'minItems', 'maxItems',
  // number / integer
  'minimum', 'maximum',
]);

/** The shape of the subset. Every keyword is optional; {@link SUPPORTED_KEYWORDS} is the
 *  authoritative list (this type only makes the interpreter readable). */
export interface AppProfileSubSchema {
  type?: string;
  description?: string;
  examples?: unknown[];
  properties?: Record<string, AppProfileSubSchema>;
  additionalProperties?: unknown;
  required?: string[];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  items?: AppProfileSubSchema;
  uniqueItems?: boolean;
  minItems?: number;
  maxItems?: number;
  minimum?: number;
  maximum?: number;
}

/** The committed schema, as loaded from {@code schemas/app-profile.schema.json}. */
export const APP_PROFILE_SCHEMA: AppProfileSubSchema = schemaJson as AppProfileSubSchema;

/** The top-level sections the schema admits, in schema order — the contract the bff
 *  mirrors and the help text lists. */
export const APP_PROFILE_SECTIONS: readonly string[] = Object.keys(APP_PROFILE_SCHEMA.properties ?? {});

/** The editor's default body: the schema's own first example, which is the
 *  cpu/memory pair the editor has always defaulted, now under {@code resources}. */
export const DEFAULT_APP_PROFILE_JSON = '{\n  "resources": {\n    "cpu": "500m",\n    "memory": "512Mi"\n  }\n}';

/**
 * Validate the editor text against the committed schema. Blank text is the minimal
 * valid profile ({@code {}}). Returns EVERY field error, not just the first, so the
 * operator fixes a template in one pass.
 */
export function validateAppProfile(raw: string): AppProfileValidation {
  return validateAgainstSchema(APP_PROFILE_SCHEMA, raw);
}

/**
 * {@link validateAppProfile} against an ARBITRARY subschema. Exported so the spec can
 * drive the interpreter with a probe schema and prove the fail-CLOSED paths (a node with
 * no {@code type}, an unsupported {@code type}, a non-boolean {@code additionalProperties})
 * actually refuse — the committed file trips none of them, so nothing else may call this
 * with anything but {@link APP_PROFILE_SCHEMA}.
 */
export function validateAgainstSchema(schema: AppProfileSubSchema, raw: string): AppProfileValidation {
  const text = raw.trim();
  let parsed: unknown;
  try {
    parsed = text.length === 0 ? {} : JSON.parse(text);
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    return { ok: false, kind: 'json', errors: [{ path: '$', message: `not valid JSON (${reason})` }] };
  }
  const errors: AppProfileFieldError[] = [];
  check(parsed, schema, '$', errors);
  if (errors.length > 0) {
    return { ok: false, kind: 'schema', errors };
  }
  return { ok: true, value: parsed as Record<string, unknown> };
}

function child(path: string, key: string): string {
  return path === '$' ? key : `${path}.${key}`;
}

function item(path: string, index: number): string {
  return path === '$' ? `[${index}]` : `${path}[${index}]`;
}

function isType(value: unknown, type: TypeName): boolean {
  switch (type) {
    case 'object': return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'array': return Array.isArray(value);
    case 'string': return typeof value === 'string';
    case 'integer': return typeof value === 'number' && Number.isInteger(value);
    case 'number': return typeof value === 'number' && Number.isFinite(value);
    case 'boolean': return typeof value === 'boolean';
  }
}

function article(type: TypeName): string {
  return (type === 'object' || type === 'array' || type === 'integer') ? `an ${type}` : `a ${type}`;
}

function hint(schema: AppProfileSubSchema): string {
  const ex = schema.examples;
  if (!Array.isArray(ex) || ex.length === 0) return '';
  return ` (e.g. ${ex.map((x) => JSON.stringify(x)).join(', ')})`;
}

function check(value: unknown, schema: AppProfileSubSchema, path: string, errors: AppProfileFieldError[]): void {
  const type = schema.type;
  if (type === undefined) {
    // Fail CLOSED. Every branch below is gated on `type`, so a subschema without one
    // would have ALL of its keywords skipped and accept any value — the simplest way to
    // fail open, and one the keyword guard cannot see (it only rejects UNKNOWN keywords).
    errors.push({ path, message: 'schema error: subschema declares no "type"' });
    return;
  }
  if (!(TYPES as readonly string[]).includes(type)) {
    // Fail CLOSED on a type the interpreter does not know rather than accept anything.
    errors.push({ path, message: `schema error: unsupported type "${type}"` });
    return;
  }
  if (!isType(value, type as TypeName)) {
    errors.push({ path, message: `must be ${article(type as TypeName)}` });
    return;
  }

  if (type === 'object') {
    const obj = value as Record<string, unknown>;
    const props = schema.properties ?? {};
    const additional = schema.additionalProperties;
    if (additional !== undefined && additional !== false && additional !== true) {
      // A schema-object additionalProperties is a form the interpreter does not implement;
      // treating it as "open" would accept every unknown key silently.
      errors.push({ path, message: 'schema error: unsupported additionalProperties (must be a boolean)' });
      return;
    }
    for (const req of schema.required ?? []) {
      if (!Object.prototype.hasOwnProperty.call(obj, req)) {
        errors.push({ path: child(path, req), message: 'is required' });
      }
    }
    for (const key of Object.keys(obj)) {
      const sub = Object.prototype.hasOwnProperty.call(props, key) ? props[key] : undefined;
      if (sub === undefined) {
        if (additional === false) {
          const allowed = Object.keys(props);
          errors.push({
            path: child(path, key),
            message: `unknown field (allowed here: ${allowed.length ? allowed.join(', ') : 'none'})`,
          });
        }
        continue;
      }
      check(obj[key], sub, child(path, key), errors);
    }
    return;
  }

  if (type === 'array') {
    const arr = value as unknown[];
    if (schema.minItems !== undefined && arr.length < schema.minItems) {
      errors.push({ path, message: `must have at least ${schema.minItems} item(s)` });
    }
    if (schema.maxItems !== undefined && arr.length > schema.maxItems) {
      errors.push({ path, message: `must have at most ${schema.maxItems} item(s)` });
    }
    if (schema.uniqueItems) {
      const seen = new Set<string>();
      arr.forEach((v, i) => {
        const key = JSON.stringify(v);
        if (seen.has(key)) errors.push({ path: item(path, i), message: 'duplicates an earlier item' });
        seen.add(key);
      });
    }
    if (schema.items !== undefined) {
      const items = schema.items;
      arr.forEach((v, i) => check(v, items, item(path, i), errors));
    }
    return;
  }

  if (type === 'string') {
    const s = value as string;
    if (schema.minLength !== undefined && s.length < schema.minLength) {
      errors.push({ path, message: `must be at least ${schema.minLength} character(s)` });
    }
    if (schema.maxLength !== undefined && s.length > schema.maxLength) {
      errors.push({ path, message: `must be at most ${schema.maxLength} character(s)` });
    }
    if (schema.pattern !== undefined && !new RegExp(schema.pattern, 'u').test(s)) {
      errors.push({ path, message: `must match ${schema.pattern}${hint(schema)}` });
    }
    return;
  }

  if (type === 'integer' || type === 'number') {
    const n = value as number;
    if (schema.minimum !== undefined && n < schema.minimum) {
      errors.push({ path, message: `must be at least ${schema.minimum}` });
    }
    if (schema.maximum !== undefined && n > schema.maximum) {
      errors.push({ path, message: `must be at most ${schema.maximum}` });
    }
  }
}

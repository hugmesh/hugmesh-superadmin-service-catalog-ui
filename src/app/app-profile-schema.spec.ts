import {
  APP_PROFILE_SCHEMA,
  APP_PROFILE_SECTIONS,
  AppProfileSubSchema,
  DEFAULT_APP_PROFILE_JSON,
  SUPPORTED_KEYWORDS,
  validateAppProfile,
} from './app-profile-schema';

/** Every (keyword, subschema) pair in the committed schema, depth-first. */
function walk(schema: AppProfileSubSchema, at: string, visit: (at: string, keyword: string, node: AppProfileSubSchema) => void): void {
  for (const keyword of Object.keys(schema)) visit(at, keyword, schema);
  for (const [k, sub] of Object.entries(schema.properties ?? {})) walk(sub, `${at}.${k}`, visit);
  if (schema.items) walk(schema.items, `${at}[]`, visit);
}

function errorsOf(raw: string): Record<string, string> {
  const v = validateAppProfile(raw);
  if (v.ok) fail(`expected a refusal for ${raw}`);
  const out: Record<string, string> = {};
  if (!v.ok) for (const e of v.errors) out[e.path] = e.message;
  return out;
}

function expectRefusedAt(raw: string, path: string, messagePart: string): void {
  const errs = errorsOf(raw);
  expect(Object.keys(errs)).withContext(`errors for ${raw}`).toContain(path);
  expect(errs[path]).withContext(`message at ${path} for ${raw}`).toContain(messagePart);
}

describe('schemas/app-profile.schema.json — the committed contract', () => {
  it('is a JSON Schema 2020-12 object schema with exactly the four sections the bff and the issue name', () => {
    expect((APP_PROFILE_SCHEMA as unknown as Record<string, unknown>)['$schema'])
      .toBe('https://json-schema.org/draft/2020-12/schema');
    expect(APP_PROFILE_SCHEMA.type).toBe('object');
    expect(APP_PROFILE_SECTIONS).toEqual(['resources', 'roles', 'certs', 'exposure']);
  });

  it('pins the leaf field list the bff mirrors (adding a field here is a contract change)', () => {
    const leaves: string[] = [];
    walk(APP_PROFILE_SCHEMA, '$', (at, keyword, node) => {
      if (keyword === 'type' && node.type !== 'object' && node.type !== 'array') leaves.push(at);
    });
    expect(leaves).toEqual([
      '$.resources.cpu',
      '$.resources.memory',
      '$.roles[]',
      '$.certs.altNames[]',
      '$.certs.ttl',
      '$.exposure.routes[]',
      '$.exposure.ports[]',
      '$.exposure.mfaRequired',
    ]);
  });

  it('rejects unknown fields EXPLICITLY: every object schema carries additionalProperties:false', () => {
    const open: string[] = [];
    walk(APP_PROFILE_SCHEMA, '$', (at, keyword, node) => {
      if (keyword === 'type' && node.type === 'object' && node.additionalProperties !== false) open.push(at);
    });
    expect(open).withContext('object schemas that would accept unknown keys').toEqual([]);
  });

  it('uses only keywords the UI interpreter implements (an unimplemented keyword would fail OPEN)', () => {
    const unknown: string[] = [];
    walk(APP_PROFILE_SCHEMA, '$', (at, keyword, node) => {
      if (!SUPPORTED_KEYWORDS.has(keyword)) unknown.push(`${at}:${keyword}`);
      if (keyword === 'type' && typeof node.type !== 'string') unknown.push(`${at}:type is not a single string`);
      if (keyword === 'pattern') expect(() => new RegExp(node.pattern as string, 'u')).withContext(at).not.toThrow();
    });
    expect(unknown).toEqual([]);
  });

  it('gives truthful hints: every leaf example satisfies its own leaf schema, and every root example validates', () => {
    walk(APP_PROFILE_SCHEMA, '$', (at, keyword, node) => {
      if (keyword !== 'examples' || at === '$') return;
      for (const ex of node.examples ?? []) {
        // Wrap the leaf in a root object so the same public entry point checks it.
        const parts = at.replace(/^\$\./, '').split('.');
        let body: unknown = ex;
        for (const part of parts.reverse()) {
          body = part.endsWith('[]') ? { [part.slice(0, -2)]: [body] } : { [part]: body };
        }
        expect(validateAppProfile(JSON.stringify(body)).ok).withContext(`${at} example ${JSON.stringify(ex)}`).toBeTrue();
      }
    });
    for (const ex of APP_PROFILE_SCHEMA.examples ?? []) {
      expect(validateAppProfile(JSON.stringify(ex)).ok).withContext(JSON.stringify(ex)).toBeTrue();
    }
  });
});

describe('validateAppProfile — valid profiles', () => {
  it('accepts the editor default body', () => {
    const v = validateAppProfile(DEFAULT_APP_PROFILE_JSON);
    expect(v.ok).toBeTrue();
    if (v.ok) expect(v.value).toEqual({ resources: { cpu: '500m', memory: '512Mi' } });
  });

  it('accepts {} and blank text as the minimal profile (every section is optional)', () => {
    expect(validateAppProfile('{}').ok).toBeTrue();
    const blank = validateAppProfile('   \n');
    expect(blank.ok).toBeTrue();
    if (blank.ok) expect(blank.value).toEqual({});
  });

  it('accepts a profile using every section and field', () => {
    const v = validateAppProfile(JSON.stringify({
      resources: { cpu: '1', memory: '1Gi' },
      roles: ['ROLE_ADMIN', 'ROLE_MESH'],
      certs: { altNames: ['owncast', 'owncast.acme-be.svc.cluster.local'], ttl: '720h' },
      exposure: { routes: ['/api/owncast/', '/ws/owncast/**'], ports: [8080, 8443], mfaRequired: true },
    }));
    expect(v.ok).withContext(JSON.stringify(v)).toBeTrue();
  });

  it('accepts the Kubernetes quantity spellings the platform uses', () => {
    for (const cpu of ['500m', '1', '0.5', '2']) {
      expect(validateAppProfile(`{"resources":{"cpu":"${cpu}"}}`).ok).withContext(cpu).toBeTrue();
    }
    for (const mem of ['512Mi', '1Gi', '256M', '1024', '0.5Gi']) {
      expect(validateAppProfile(`{"resources":{"memory":"${mem}"}}`).ok).withContext(mem).toBeTrue();
    }
  });
});

describe('validateAppProfile — each invalid class is refused with the field named', () => {
  it('text that is not JSON: a single "$" error of kind json', () => {
    const v = validateAppProfile('{not json');
    expect(v.ok).toBeFalse();
    if (!v.ok) {
      expect(v.kind).toBe('json');
      expect(v.errors.length).toBe(1);
      expect(v.errors[0].path).toBe('$');
      expect(v.errors[0].message).toContain('not valid JSON');
    }
  });

  it('a root that is not an object (array / string / number / null)', () => {
    for (const raw of ['[]', '"cpu"', '42', 'null', 'true']) {
      expectRefusedAt(raw, '$', 'must be an object');
    }
  });

  it('the legacy flat body {"cpu":"500m","memory":"512Mi"} names BOTH unknown keys and lists the allowed sections', () => {
    const errs = errorsOf('{"cpu":"500m","memory":"512Mi"}');
    expect(errs['cpu']).toContain('unknown field');
    expect(errs['cpu']).toContain('resources, roles, certs, exposure');
    expect(errs['memory']).toContain('unknown field');
  });

  it('an unknown NESTED field names its dotted path and the keys allowed at that level', () => {
    const errs = errorsOf('{"resources":{"cpu":"500m","limits":{}}}');
    expect(errs['resources.limits']).toContain('unknown field');
    expect(errs['resources.limits']).toContain('cpu, memory');
    expect(errorsOf('{"exposure":{"public":true}}')['exposure.public']).toContain('routes, ports, mfaRequired');
  });

  it('a wrong TYPE at each level', () => {
    expectRefusedAt('{"resources":"500m"}', 'resources', 'must be an object');
    expectRefusedAt('{"resources":{"cpu":500}}', 'resources.cpu', 'must be a string');
    expectRefusedAt('{"roles":"ROLE_ADMIN"}', 'roles', 'must be an array');
    expectRefusedAt('{"roles":[1]}', 'roles[0]', 'must be a string');
    expectRefusedAt('{"certs":[]}', 'certs', 'must be an object');
    expectRefusedAt('{"exposure":{"ports":["8080"]}}', 'exposure.ports[0]', 'must be an integer');
    expectRefusedAt('{"exposure":{"ports":[80.5]}}', 'exposure.ports[0]', 'must be an integer');
    expectRefusedAt('{"exposure":{"mfaRequired":"yes"}}', 'exposure.mfaRequired', 'must be a boolean');
    expectRefusedAt('{"exposure":{"routes":null}}', 'exposure.routes', 'must be an array');
  });

  it('a value that does not match its PATTERN, with the example hint', () => {
    expectRefusedAt('{"resources":{"cpu":"lots"}}', 'resources.cpu', 'must match');
    expect(errorsOf('{"resources":{"cpu":"lots"}}')['resources.cpu']).toContain('"500m"');
    expectRefusedAt('{"resources":{"cpu":"500mi"}}', 'resources.cpu', 'must match');
    expectRefusedAt('{"resources":{"memory":"512MB"}}', 'resources.memory', 'must match');
    expectRefusedAt('{"roles":["admin"]}', 'roles[0]', 'must match');
    expectRefusedAt('{"roles":["ROLE_admin"]}', 'roles[0]', 'must match');
    expectRefusedAt('{"roles":["ROLE_ADMIN","role"]}', 'roles[1]', 'must match');
    expectRefusedAt('{"certs":{"ttl":"1 month"}}', 'certs.ttl', 'must match');
    expectRefusedAt('{"certs":{"ttl":"30d"}}', 'certs.ttl', 'must match');
    expectRefusedAt('{"certs":{"altNames":["Bad_Host"]}}', 'certs.altNames[0]', 'must match');
    expectRefusedAt('{"certs":{"altNames":["owncast."]}}', 'certs.altNames[0]', 'must match');
    expectRefusedAt('{"exposure":{"routes":["api/owncast/"]}}', 'exposure.routes[0]', 'must match');
    expectRefusedAt('{"exposure":{"routes":["/api/owncast/*"]}}', 'exposure.routes[0]', 'must match');
    expectRefusedAt('{"exposure":{"routes":["/api/own cast/"]}}', 'exposure.routes[0]', 'must match');
  });

  it('a port outside 1..65535', () => {
    expectRefusedAt('{"exposure":{"ports":[0]}}', 'exposure.ports[0]', 'must be at least 1');
    expectRefusedAt('{"exposure":{"ports":[65536]}}', 'exposure.ports[0]', 'must be at most 65535');
    expectRefusedAt('{"exposure":{"ports":[8080,-1]}}', 'exposure.ports[1]', 'must be at least 1');
  });

  it('duplicate array items', () => {
    expectRefusedAt('{"roles":["ROLE_ADMIN","ROLE_ADMIN"]}', 'roles[1]', 'duplicates');
    expectRefusedAt('{"exposure":{"ports":[8080,8080]}}', 'exposure.ports[1]', 'duplicates');
  });

  it('too many items / too long a string', () => {
    const many = JSON.stringify({ roles: Array.from({ length: 33 }, (_, i) => `ROLE_R${i}`) });
    expectRefusedAt(many, 'roles', 'at most 32');
    expectRefusedAt(`{"resources":{"cpu":"${'9'.repeat(40)}"}}`, 'resources.cpu', 'at most 32 character');
  });

  it('reports EVERY error at once, not just the first', () => {
    const errs = errorsOf('{"resources":{"cpu":"lots"},"roles":["x"],"bogus":1,"exposure":{"ports":[0]}}');
    expect(Object.keys(errs).sort()).toEqual(['bogus', 'exposure.ports[0]', 'resources.cpu', 'roles[0]']);
  });
});

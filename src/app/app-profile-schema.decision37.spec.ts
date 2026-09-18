import {
  APP_PROFILE_SCHEMA,
  APP_PROFILE_SECTIONS,
  AppProfileSubSchema,
  validateAppProfile,
} from './app-profile-schema';

/**
 * DECISION 37 — the three answers that RATIFY what this repo already shipped, pinned so the
 * next agent cannot drift off them.
 *
 * <p>Recorded by the operator on 2026-09-17
 * (hugmesh-generator#347, comment 5722264043):
 * <ul>
 *   <li><b>37a — {@code ROLE_<UPPER>}.</b> {@code roles[]} carries CASDOOR role names, the
 *       canonical {@code ROLE_<UPPER>} form {@code CasdoorAdminClient.ensureRoles} mints and
 *       {@code gateway_route_access.role} references — NOT the per-service
 *       {@code requiresRole} slug ({@code owncast-admin}) that the issue's open question
 *       offered as the alternative.</li>
 *   <li><b>37b — STRICT on unknown keys.</b> {@code additionalProperties: false} stays, at
 *       every level. A typo is refused, never stored as an inert default.</li>
 *   <li><b>37c — keep {@code exposure.mfaRequired}.</b> It sits outside the "resources,
 *       roles, certificates, what it exposes" list the original decision named, and is kept
 *       deliberately because it is grounded in {@code RouteRule.mfa_required}.</li>
 * </ul>
 *
 * <p>This is a RATIFICATION, so these tests assert the chosen shape DIRECTLY rather than
 * only its consequences: each one goes red if a later change quietly takes the other branch
 * of the question the operator answered. The sibling half of the same decision — that the
 * BFF may now cut a byte-identical copy of the file and validate against it — is guarded by
 * {@code scripts/assert-schema-pin.mjs} here and {@code AppProfileSchemaMirrorTest} in
 * hugmesh-admin-bff-api. Note what each of those does and does not prove: the matching sha256
 * LITERALS only make an edit deliberate within one repo (moving the file and the literal
 * together satisfies both repos' literals while the files diverge — measured), so each side
 * also READS the other repo's file and compares bytes whenever that checkout is reachable.
 * That byte comparison is the half that enforces the contract.
 */
describe('decision 37 — the ratified app-profile contract', () => {

  describe('37a — roles are Casdoor ROLE_<UPPER> names, not the per-service requiresRole slug', () => {
    const roles = APP_PROFILE_SCHEMA.properties?.['roles'] as AppProfileSubSchema | undefined;

    it('pins the items pattern to the ROLE_<UPPER> form verbatim', () => {
      expect(roles?.type).toBe('array');
      expect(roles?.items?.type).toBe('string');
      expect(roles?.items?.pattern).toBe('^ROLE_[A-Z][A-Z0-9_]*$');
    });

    it('accepts the ROLE_<UPPER> names the platform actually mints', () => {
      for (const role of ['ROLE_ADMIN', 'ROLE_SUPERADMIN', 'ROLE_MESH', 'ROLE_OWNCAST', 'ROLE_APP_STORE', 'ROLE_X9']) {
        expect(validateAppProfile(`{"roles":["${role}"]}`).ok).withContext(role).toBeTrue();
      }
    });

    it('REFUSES the per-service requiresRole slug form that decision 37a ruled against', () => {
      // These are the spellings a `requiresRole` slug takes on a service_deployment row.
      // If a later change switches the vocabulary, every one of them starts passing.
      for (const slug of ['owncast', 'owncast-admin', 'app-store', 'Owncast', 'role_owncast', 'ROLE_owncast']) {
        const v = validateAppProfile(`{"roles":["${slug}"]}`);
        expect(v.ok).withContext(`${slug} must NOT be a valid role`).toBeFalse();
        if (!v.ok) {
          expect(v.errors.map((e) => e.path)).withContext(slug).toEqual(['roles[0]']);
          expect(v.errors[0].message).withContext(slug).toContain('^ROLE_[A-Z][A-Z0-9_]*$');
        }
      }
    });

    it('refuses a bare ROLE_ prefix with nothing after it', () => {
      expect(validateAppProfile('{"roles":["ROLE_"]}').ok).toBeFalse();
    });
  });

  describe('37b — STRICT on unknown keys: additionalProperties:false, at every level', () => {
    it('declares additionalProperties:false literally on the root and on every named object', () => {
      expect(APP_PROFILE_SCHEMA.additionalProperties).toBe(false);
      for (const section of ['resources', 'certs', 'exposure']) {
        const sub = APP_PROFILE_SCHEMA.properties?.[section];
        expect(sub?.type).withContext(section).toBe('object');
        expect(sub?.additionalProperties).withContext(section).toBe(false);
      }
    });

    it('never declares additionalProperties:true anywhere (the LENIENT branch 37b ruled against)', () => {
      const lenient: string[] = [];
      const walk = (node: AppProfileSubSchema, at: string): void => {
        if (node.additionalProperties === true) lenient.push(at);
        for (const [k, sub] of Object.entries(node.properties ?? {})) walk(sub, `${at}.${k}`);
        if (node.items) walk(node.items, `${at}[]`);
      };
      walk(APP_PROFILE_SCHEMA, '$');
      expect(lenient).withContext('objects that would silently accept unknown keys').toEqual([]);
    });

    it('refuses an unknown key at the root and at every nested level, naming what IS allowed', () => {
      const cases: ReadonlyArray<readonly [string, string, string]> = [
        ['{"bogus":1}', 'bogus', 'resources, roles, certs, exposure'],
        ['{"resources":{"bogus":1}}', 'resources.bogus', 'cpu, memory'],
        ['{"certs":{"bogus":1}}', 'certs.bogus', 'altNames, ttl'],
        ['{"exposure":{"bogus":1}}', 'exposure.bogus', 'routes, ports, mfaRequired'],
      ];
      for (const [raw, path, allowed] of cases) {
        const v = validateAppProfile(raw);
        expect(v.ok).withContext(raw).toBeFalse();
        if (!v.ok) {
          const err = v.errors.find((e) => e.path === path);
          expect(err).withContext(`${raw} -> ${path}`).toBeDefined();
          expect(err?.message).withContext(raw).toBe(`unknown field (allowed here: ${allowed})`);
        }
      }
    });
  });

  describe('37c — exposure.mfaRequired is KEPT', () => {
    it('is present in the schema as a boolean leaf', () => {
      const mfa = APP_PROFILE_SCHEMA.properties?.['exposure']?.properties?.['mfaRequired'];
      expect(mfa).withContext('exposure.mfaRequired was removed — decision 37c says KEEP it').toBeDefined();
      expect(mfa?.type).toBe('boolean');
    });

    it('accepts both booleans and refuses anything else', () => {
      expect(validateAppProfile('{"exposure":{"mfaRequired":true}}').ok).toBeTrue();
      expect(validateAppProfile('{"exposure":{"mfaRequired":false}}').ok).toBeTrue();
      for (const bad of ['"true"', '1', '0', 'null', '[]', '{}']) {
        const v = validateAppProfile(`{"exposure":{"mfaRequired":${bad}}}`);
        expect(v.ok).withContext(bad).toBeFalse();
        if (!v.ok) expect(v.errors[0].message).withContext(bad).toBe('must be a boolean');
      }
    });

    it('documents the field it mirrors, so the resolution effector knows what to drive', () => {
      const mfa = APP_PROFILE_SCHEMA.properties?.['exposure']?.properties?.['mfaRequired'];
      expect(mfa?.description).toContain('mfa_required');
    });
  });

  describe('the sections the decision names are exactly the sections that exist', () => {
    it('resources, roles, certs, exposure — nothing added, nothing dropped', () => {
      expect(APP_PROFILE_SECTIONS).toEqual(['resources', 'roles', 'certs', 'exposure']);
    });
  });
});

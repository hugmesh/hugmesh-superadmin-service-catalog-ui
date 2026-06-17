import { TestBed } from '@angular/core/testing';
import {
  AppstoreService,
  AppstoreApiError,
  APPSTORE_BASE_URL,
  ServiceCuration,
  AppProfile,
  ServiceDeployment,
} from './appstore.service';

/**
 * The service layer is the thing that makes the PR1 data layer usable, so the
 * spec asserts it calls the EXACT snapdragon-admin-bff-api appstore paths (URL +
 * method + body), branch feat/superadmin-appstore-data-layer (PR #56):
 *
 *   GET    /bff/superadmin/service-store/{domain}
 *   POST   /bff/superadmin/service-store/{domain}/offer        {serviceKey}
 *   POST   /bff/superadmin/service-store/{domain}/withdraw     {serviceKey}
 *   GET    /bff/superadmin/app-profiles
 *   GET    /bff/superadmin/app-profiles/{name}
 *   POST   /bff/superadmin/app-profiles                        {name, profileJson}
 *   PUT    /bff/superadmin/app-profiles/{name}                 {name, profileJson}
 *   DELETE /bff/superadmin/app-profiles/{name}
 *   GET    /bff/superadmin/service-store/{domain}/deployments
 *   POST   /bff/superadmin/service-store/{domain}/deployments  {serviceKey, profileRef, endingAt, enforceActions}
 *   POST   /bff/superadmin/service-store/{domain}/deployments/{id}/end
 *   POST   /bff/superadmin/service-store/{domain}/deployments/{id}/provision {sourceKind, repoUrl, path, targetRevision}  (PR #67 effector)
 *   GET    /bff/admin/service-store                            (the two-tier read)
 *
 * fetch is stubbed; each test asserts the URL the service hit + the JSON body it
 * sent + that the Bearer from snap.session is attached.
 */
describe('AppstoreService (exact PR1 bff paths)', () => {
  let service: AppstoreService;
  let fetchSpy: jasmine.Spy;

  /** The captured (url, init) of the LAST fetch call. */
  function lastCall(): { url: string; init: RequestInit } {
    const args = fetchSpy.calls.mostRecent().args;
    return { url: args[0] as string, init: (args[1] ?? {}) as RequestInit };
  }
  function sentBody(): any {
    const b = lastCall().init.body;
    return b ? JSON.parse(b as string) : undefined;
  }
  function sentHeaders(): Record<string, string> {
    return (lastCall().init.headers ?? {}) as Record<string, string>;
  }

  /** Make the next fetch resolve OK with `json`. */
  function ok(json: unknown, status = 200): void {
    fetchSpy.and.resolveTo({
      ok: true,
      status,
      text: () => Promise.resolve(json === undefined ? '' : JSON.stringify(json)),
    } as unknown as Response);
  }
  /** Make the next fetch resolve a non-ok status with an error body. */
  function failWith(status: number, body: unknown = { error: 'nope' }): void {
    fetchSpy.and.resolveTo({
      ok: false,
      status,
      text: () => Promise.resolve(JSON.stringify(body)),
    } as unknown as Response);
  }

  const curation: ServiceCuration = {
    id: 'cur-1', domain: 'acme.test', serviceKey: 'owncast', state: 'offered',
    curatedBySubject: 'google:root', createdAt: 'T', updatedAt: 'T',
  };
  const profile: AppProfile = {
    id: 'pr-1', name: 'small-postgres', profileJson: '{"cpu":"500m"}',
    createdBySubject: 'google:root', createdAt: 'T', updatedAt: 'T',
  };
  const deployment: ServiceDeployment = {
    id: 'dep-1', domain: 'acme.test', serviceKey: 'owncast', profileRef: 'small-postgres',
    state: 'active', createdAt: 'T', endingAt: '2030-01-01T00:00:00Z',
    enforceActions: 'teardown,alert', propagationState: 'pending', endedAt: null,
    createdBySubject: 'google:root',
  };

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('snap.session', JSON.stringify({ bffToken: 'tok-abc' }));
    TestBed.configureTestingModule({
      providers: [AppstoreService, { provide: APPSTORE_BASE_URL, useValue: '' }],
    });
    service = TestBed.inject(AppstoreService);
    fetchSpy = spyOn(globalThis, 'fetch');
  });

  afterEach(() => localStorage.clear());

  // ── CURATION ──────────────────────────────────────────────────────────────

  it('listCuration → GET /bff/superadmin/service-store/{domain}', async () => {
    ok([curation]);
    const rows = await service.listCuration('acme.test');
    const { url, init } = lastCall();
    expect(url).toBe('/bff/superadmin/service-store/acme.test');
    expect(init.method).toBe('GET');
    expect(rows[0].serviceKey).toBe('owncast');
  });

  it('offer → POST /bff/superadmin/service-store/{domain}/offer with {serviceKey} (domain in the PATH)', async () => {
    ok(curation);
    await service.offer('acme.test', 'owncast');
    const { url, init } = lastCall();
    expect(url).toBe('/bff/superadmin/service-store/acme.test/offer');
    expect(init.method).toBe('POST');
    expect(sentBody()).toEqual({ serviceKey: 'owncast' });
    expect(sentBody().domain).withContext('domain is the PATH, never the body').toBeUndefined();
  });

  it('withdraw → POST /bff/superadmin/service-store/{domain}/withdraw with {serviceKey}', async () => {
    ok({ ...curation, state: 'withdrawn' });
    const row = await service.withdraw('acme.test', 'owncast');
    expect(lastCall().url).toBe('/bff/superadmin/service-store/acme.test/withdraw');
    expect(sentBody()).toEqual({ serviceKey: 'owncast' });
    expect(row.state).toBe('withdrawn');
  });

  it('encodes a domain with dots/slashes safely in the path', async () => {
    ok([]);
    await service.listCuration('a/b.test');
    expect(lastCall().url).toBe('/bff/superadmin/service-store/a%2Fb.test');
  });

  // ── APP PROFILES ────────────────────────────────────────────────────────

  it('listProfiles → GET /bff/superadmin/app-profiles', async () => {
    ok([profile]);
    const rows = await service.listProfiles();
    expect(lastCall().url).toBe('/bff/superadmin/app-profiles');
    expect(lastCall().init.method).toBe('GET');
    expect(rows[0].name).toBe('small-postgres');
  });

  it('getProfile → GET /bff/superadmin/app-profiles/{name}', async () => {
    ok(profile);
    await service.getProfile('small-postgres');
    expect(lastCall().url).toBe('/bff/superadmin/app-profiles/small-postgres');
  });

  it('createProfile → POST /bff/superadmin/app-profiles with {name, profileJson}', async () => {
    ok(profile, 201);
    await service.createProfile('small-postgres', '{"cpu":"500m"}');
    const { url, init } = lastCall();
    expect(url).toBe('/bff/superadmin/app-profiles');
    expect(init.method).toBe('POST');
    expect(sentBody()).toEqual({ name: 'small-postgres', profileJson: '{"cpu":"500m"}' });
  });

  it('updateProfile → PUT /bff/superadmin/app-profiles/{name} (path name identifies the row)', async () => {
    ok(profile);
    await service.updateProfile('small-postgres', '{"cpu":"1"}');
    const { url, init } = lastCall();
    expect(url).toBe('/bff/superadmin/app-profiles/small-postgres');
    expect(init.method).toBe('PUT');
    expect(sentBody().profileJson).toBe('{"cpu":"1"}');
  });

  it('deleteProfile → DELETE /bff/superadmin/app-profiles/{name}', async () => {
    ok(undefined, 204);
    await service.deleteProfile('small-postgres');
    expect(lastCall().url).toBe('/bff/superadmin/app-profiles/small-postgres');
    expect(lastCall().init.method).toBe('DELETE');
  });

  // ── DEPLOYMENTS ───────────────────────────────────────────────────────────

  it('listDeployments → GET /bff/superadmin/service-store/{domain}/deployments', async () => {
    ok([deployment]);
    const rows = await service.listDeployments('acme.test');
    expect(lastCall().url).toBe('/bff/superadmin/service-store/acme.test/deployments');
    expect(rows[0].state).toBe('active');
  });

  it('createDeployment → POST .../{domain}/deployments with created/ending/enforce (serviceKey+profileRef+endingAt+enforceActions)', async () => {
    ok(deployment, 201);
    await service.createDeployment('acme.test', {
      serviceKey: 'owncast',
      profileRef: 'small-postgres',
      endingAt: '2030-01-01T00:00:00Z',
      enforceActions: 'teardown,alert',
    });
    const { url, init } = lastCall();
    expect(url).toBe('/bff/superadmin/service-store/acme.test/deployments');
    expect(init.method).toBe('POST');
    expect(sentBody()).toEqual({
      serviceKey: 'owncast',
      profileRef: 'small-postgres',
      endingAt: '2030-01-01T00:00:00Z',
      enforceActions: 'teardown,alert',
    });
    expect(sentBody().domain).withContext('domain is the PATH, never the body').toBeUndefined();
  });

  it('endDeployment → POST .../{domain}/deployments/{id}/end', async () => {
    ok({ ...deployment, state: 'ended' });
    const row = await service.endDeployment('acme.test', 'dep-1');
    expect(lastCall().url).toBe('/bff/superadmin/service-store/acme.test/deployments/dep-1/end');
    expect(lastCall().init.method).toBe('POST');
    expect(row.state).toBe('ended');
  });

  it('provisionDeployment → POST .../{domain}/deployments/{id}/provision with {sourceKind, repoUrl, path?, targetRevision?}', async () => {
    ok({ ...deployment, propagationState: 'applied' });
    await service.provisionDeployment('acme.test', 'dep-1', {
      sourceKind: 'GIT',
      repoUrl: 'https://gitlab.acme.test/svc/owncast.git',
      path: 'deploy/',
      targetRevision: 'main',
    });
    const { url, init } = lastCall();
    expect(url).toBe('/bff/superadmin/service-store/acme.test/deployments/dep-1/provision');
    expect(init.method).toBe('POST');
    expect(sentBody()).toEqual({
      sourceKind: 'GIT',
      repoUrl: 'https://gitlab.acme.test/svc/owncast.git',
      path: 'deploy/',
      targetRevision: 'main',
    });
    expect(sentBody().domain).withContext('domain is the PATH, never the body').toBeUndefined();
  });

  it('provisionDeployment encodes the {id} path segment safely', async () => {
    ok(deployment);
    await service.provisionDeployment('acme.test', 'a/b', { sourceKind: 'SELECT', repoUrl: 'r' });
    expect(lastCall().url).toBe('/bff/superadmin/service-store/acme.test/deployments/a%2Fb/provision');
  });

  // ── TWO-TIER ADMIN READ ─────────────────────────────────────────────────

  it('myDomainCatalog → GET /bff/admin/service-store (the two-tier admin read)', async () => {
    ok([curation]);
    const rows = await service.myDomainCatalog();
    expect(lastCall().url).toBe('/bff/admin/service-store');
    expect(lastCall().init.method).toBe('GET');
    expect(rows[0].domain).toBe('acme.test');
  });

  // ── auth + error surfacing ────────────────────────────────────────────────

  it('attaches the Bearer token from snap.session on every call', async () => {
    ok([]);
    await service.listProfiles();
    expect(sentHeaders()['Authorization']).toBe('Bearer tok-abc');
  });

  it('surfaces a 403 as AppstoreApiError.isForbidden (the server-authoritative deny)', async () => {
    failWith(403, { error: 'forbidden' });
    let caught: unknown;
    try {
      await service.offer('acme.test', 'owncast');
    } catch (e) {
      caught = e;
    }
    expect(caught instanceof AppstoreApiError).toBeTrue();
    expect((caught as AppstoreApiError).isForbidden).toBeTrue();
  });

  it('surfaces a 409 as AppstoreApiError.isConflict (a duplicate profile name)', async () => {
    failWith(409, { error: 'duplicate' });
    let caught: unknown;
    try {
      await service.createProfile('dup', '{}');
    } catch (e) {
      caught = e;
    }
    expect(caught instanceof AppstoreApiError).toBeTrue();
    expect((caught as AppstoreApiError).isConflict).toBeTrue();
  });

  it('surfaces a 400 (the Kaniko-builder guard) as AppstoreApiError.isBadRequest with the server message', async () => {
    failWith(400, {
      message:
        'service source DOCKERFILE requires the in-cluster image builder (Kaniko) which is not yet available',
    });
    let caught: unknown;
    try {
      await service.provisionDeployment('acme.test', 'dep-1', {
        sourceKind: 'DOCKERFILE',
        repoUrl: 'r',
      });
    } catch (e) {
      caught = e;
    }
    expect(caught instanceof AppstoreApiError).toBeTrue();
    expect((caught as AppstoreApiError).isBadRequest).toBeTrue();
    expect((caught as AppstoreApiError).message).toContain('Kaniko');
  });
});

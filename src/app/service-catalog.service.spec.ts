import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  TestRequest,
} from '@angular/common/http/testing';
import {
  ServiceCatalogService,
  ServiceCatalogApiError,
  SERVICE_CATALOG_BASE_URL,
  ServiceCuration,
  AppProfile,
  ServiceDeployment,
} from './service-catalog.service';
import { bffAuthInterceptor } from './auth.interceptor';

/**
 * The service layer is the thing that makes the PR1 data layer usable, so the
 * spec asserts it calls the EXACT snapdragon-admin-bff-api serviceCatalog paths (URL +
 * method + body), branch feat/superadmin-service-catalog-data-layer (PR #56):
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
 * Since the ng-openapi-gen migration the service DELEGATES to the generated typed
 * clients (HttpClient), so the transport is exercised with Angular's
 * {@link HttpTestingController} instead of a fetch stub. Each test asserts the
 * URL the service hit + the JSON body it sent + that the Bearer from snap.session
 * is attached (now by {@code bffAuthInterceptor}) — the SAME wire contract.
 */
describe('ServiceCatalogService (exact PR1 bff paths)', () => {
  let service: ServiceCatalogService;
  let httpMock: HttpTestingController;

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
      providers: [
        ServiceCatalogService,
        { provide: SERVICE_CATALOG_BASE_URL, useValue: '' },
        provideHttpClient(withInterceptors([bffAuthInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ServiceCatalogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  /** Expect a single request to (method, url), assert the sent JSON body equals
   *  `body` (when given), then flush `respond`. Returns the captured request so a
   *  test can assert headers. */
  function expectOne(method: string, url: string, respond: unknown, status = 200): TestRequest {
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe(method);
    req.flush(respond as any, { status, statusText: status === 204 ? 'No Content' : 'OK' });
    return req;
  }

  // ── CURATION ──────────────────────────────────────────────────────────────

  it('listCuration → GET /bff/superadmin/service-store/{domain}', async () => {
    const p = service.listCuration('acme.test');
    expectOne('GET', '/bff/superadmin/service-store/acme.test', [curation]);
    const rows = await p;
    expect(rows[0].serviceKey).toBe('owncast');
  });

  it('offer → POST /bff/superadmin/service-store/{domain}/offer with {serviceKey} (domain in the PATH)', async () => {
    const p = service.offer('acme.test', 'owncast');
    const req = httpMock.expectOne('/bff/superadmin/service-store/acme.test/offer');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ serviceKey: 'owncast' });
    expect((req.request.body as any).domain).withContext('domain is the PATH, never the body').toBeUndefined();
    req.flush(curation);
    await p;
  });

  it('withdraw → POST /bff/superadmin/service-store/{domain}/withdraw with {serviceKey}', async () => {
    const p = service.withdraw('acme.test', 'owncast');
    const req = httpMock.expectOne('/bff/superadmin/service-store/acme.test/withdraw');
    expect(req.request.body).toEqual({ serviceKey: 'owncast' });
    req.flush({ ...curation, state: 'withdrawn' });
    const row = await p;
    expect(row.state).toBe('withdrawn');
  });

  it('encodes a domain with dots/slashes safely in the path', async () => {
    const p = service.listCuration('a/b.test');
    expectOne('GET', '/bff/superadmin/service-store/a%2Fb.test', []);
    await p;
  });

  // ── APP PROFILES ────────────────────────────────────────────────────────

  it('listProfiles → GET /bff/superadmin/app-profiles', async () => {
    const p = service.listProfiles();
    const req = httpMock.expectOne('/bff/superadmin/app-profiles');
    expect(req.request.method).toBe('GET');
    req.flush([profile]);
    const rows = await p;
    expect(rows[0].name).toBe('small-postgres');
  });

  it('getProfile → GET /bff/superadmin/app-profiles/{name}', async () => {
    const p = service.getProfile('small-postgres');
    expectOne('GET', '/bff/superadmin/app-profiles/small-postgres', profile);
    await p;
  });

  it('createProfile → POST /bff/superadmin/app-profiles with {name, profileJson}', async () => {
    const p = service.createProfile('small-postgres', '{"cpu":"500m"}');
    const req = httpMock.expectOne('/bff/superadmin/app-profiles');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'small-postgres', profileJson: '{"cpu":"500m"}' });
    req.flush(profile, { status: 201, statusText: 'Created' });
    await p;
  });

  it('updateProfile → PUT /bff/superadmin/app-profiles/{name} (path name identifies the row)', async () => {
    const p = service.updateProfile('small-postgres', '{"cpu":"1"}');
    const req = httpMock.expectOne('/bff/superadmin/app-profiles/small-postgres');
    expect(req.request.method).toBe('PUT');
    expect((req.request.body as any).profileJson).toBe('{"cpu":"1"}');
    req.flush(profile);
    await p;
  });

  it('deleteProfile → DELETE /bff/superadmin/app-profiles/{name}', async () => {
    const p = service.deleteProfile('small-postgres');
    const req = httpMock.expectOne('/bff/superadmin/app-profiles/small-postgres');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await p;
  });

  // ── DEPLOYMENTS ───────────────────────────────────────────────────────────

  it('listDeployments → GET /bff/superadmin/service-store/{domain}/deployments', async () => {
    const p = service.listDeployments('acme.test');
    expectOne('GET', '/bff/superadmin/service-store/acme.test/deployments', [deployment]);
    const rows = await p;
    expect(rows[0].state).toBe('active');
  });

  it('createDeployment → POST .../{domain}/deployments with created/ending/enforce (serviceKey+profileRef+endingAt+enforceActions)', async () => {
    const p = service.createDeployment('acme.test', {
      serviceKey: 'owncast',
      profileRef: 'small-postgres',
      endingAt: '2030-01-01T00:00:00Z',
      enforceActions: 'teardown,alert',
    });
    const req = httpMock.expectOne('/bff/superadmin/service-store/acme.test/deployments');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      serviceKey: 'owncast',
      profileRef: 'small-postgres',
      endingAt: '2030-01-01T00:00:00Z',
      enforceActions: 'teardown,alert',
    });
    expect((req.request.body as any).domain).withContext('domain is the PATH, never the body').toBeUndefined();
    req.flush(deployment, { status: 201, statusText: 'Created' });
    await p;
  });

  it('endDeployment → POST .../{domain}/deployments/{id}/end', async () => {
    const p = service.endDeployment('acme.test', 'dep-1');
    const req = httpMock.expectOne('/bff/superadmin/service-store/acme.test/deployments/dep-1/end');
    expect(req.request.method).toBe('POST');
    req.flush({ ...deployment, state: 'ended' });
    const row = await p;
    expect(row.state).toBe('ended');
  });

  it('provisionDeployment → POST .../{domain}/deployments/{id}/provision with {sourceKind, repoUrl, path?, targetRevision?}', async () => {
    const p = service.provisionDeployment('acme.test', 'dep-1', {
      sourceKind: 'GIT',
      repoUrl: 'https://gitlab.acme.test/svc/owncast.git',
      path: 'deploy/',
      targetRevision: 'main',
    });
    const req = httpMock.expectOne('/bff/superadmin/service-store/acme.test/deployments/dep-1/provision');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      sourceKind: 'GIT',
      repoUrl: 'https://gitlab.acme.test/svc/owncast.git',
      path: 'deploy/',
      targetRevision: 'main',
    });
    expect((req.request.body as any).domain).withContext('domain is the PATH, never the body').toBeUndefined();
    req.flush({ ...deployment, propagationState: 'applied' });
    await p;
  });

  it('provisionDeployment encodes the {id} path segment safely', async () => {
    const p = service.provisionDeployment('acme.test', 'a/b', { sourceKind: 'SELECT', repoUrl: 'r' });
    expectOne('POST', '/bff/superadmin/service-store/acme.test/deployments/a%2Fb/provision', deployment);
    await p;
  });

  // ── TWO-TIER ADMIN READ ─────────────────────────────────────────────────

  it('myDomainCatalog → GET /bff/admin/service-store (the two-tier admin read)', async () => {
    const p = service.myDomainCatalog();
    const req = httpMock.expectOne('/bff/admin/service-store');
    expect(req.request.method).toBe('GET');
    req.flush([curation]);
    const rows = await p;
    expect(rows[0].domain).toBe('acme.test');
  });

  // ── auth + error surfacing ────────────────────────────────────────────────

  it('attaches the Bearer token from snap.session on every call', async () => {
    const p = service.listProfiles();
    const req = httpMock.expectOne('/bff/superadmin/app-profiles');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok-abc');
    req.flush([]);
    await p;
  });

  it('surfaces a 403 as ServiceCatalogApiError.isForbidden (the server-authoritative deny)', async () => {
    const p = service.offer('acme.test', 'owncast');
    httpMock
      .expectOne('/bff/superadmin/service-store/acme.test/offer')
      .flush({ error: 'forbidden' }, { status: 403, statusText: 'Forbidden' });
    let caught: unknown;
    try {
      await p;
    } catch (e) {
      caught = e;
    }
    expect(caught instanceof ServiceCatalogApiError).toBeTrue();
    expect((caught as ServiceCatalogApiError).isForbidden).toBeTrue();
  });

  it('surfaces a 409 as ServiceCatalogApiError.isConflict (a duplicate profile name)', async () => {
    const p = service.createProfile('dup', '{}');
    httpMock
      .expectOne('/bff/superadmin/app-profiles')
      .flush({ error: 'duplicate' }, { status: 409, statusText: 'Conflict' });
    let caught: unknown;
    try {
      await p;
    } catch (e) {
      caught = e;
    }
    expect(caught instanceof ServiceCatalogApiError).toBeTrue();
    expect((caught as ServiceCatalogApiError).isConflict).toBeTrue();
  });

  it('surfaces a 400 (the Kaniko-builder guard) as ServiceCatalogApiError.isBadRequest with the server message', async () => {
    const p = service.provisionDeployment('acme.test', 'dep-1', {
      sourceKind: 'DOCKERFILE',
      repoUrl: 'r',
    });
    httpMock
      .expectOne('/bff/superadmin/service-store/acme.test/deployments/dep-1/provision')
      .flush(
        {
          message:
            'service source DOCKERFILE requires the in-cluster image builder (Kaniko) which is not yet available',
        },
        { status: 400, statusText: 'Bad Request' },
      );
    let caught: unknown;
    try {
      await p;
    } catch (e) {
      caught = e;
    }
    expect(caught instanceof ServiceCatalogApiError).toBeTrue();
    expect((caught as ServiceCatalogApiError).isBadRequest).toBeTrue();
    expect((caught as ServiceCatalogApiError).message).toContain('Kaniko');
  });
});

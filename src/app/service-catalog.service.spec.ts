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
 * spec asserts it calls the EXACT hugmesh-admin-bff-api serviceCatalog paths (URL +
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
 *   GET    /bff/superadmin/optional-services                    (the optional-service toggle screen)
 *   PUT    /bff/superadmin/optional-services/{slug}             {enabled, reason?}
 *
 * Since the ng-openapi-gen migration the service DELEGATES to the generated typed
 * clients (HttpClient), so the transport is exercised with Angular's
 * {@link HttpTestingController} instead of a fetch stub. Each test asserts the
 * URL the service hit + the JSON body it sent + that the request carries the
 * HttpOnly {@code bff_} cookie as credentials (now by {@code bffAuthInterceptor}
 * via {@code withCredentials}, NOT a browser Bearer) — the SAME wire contract.
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

  it('offer WITH a step-up token carries it in X-ServiceStore-StepUp (via the HttpContext seam)', async () => {
    const p = service.offer('acme.test', 'owncast', 'stepup-tok');
    const req = httpMock.expectOne('/bff/superadmin/service-store/acme.test/offer');
    expect(req.request.headers.get('X-ServiceStore-StepUp')).withContext('step-up header carried').toBe('stepup-tok');
    expect(req.request.body).withContext('the token never leaks into the body').toEqual({ serviceKey: 'owncast' });
    req.flush(curation);
    await p;
  });

  it('offer WITHOUT a token sends NO X-ServiceStore-StepUp header (unchanged wire shape)', async () => {
    const p = service.offer('acme.test', 'owncast');
    const req = httpMock.expectOne('/bff/superadmin/service-store/acme.test/offer');
    expect(req.request.headers.has('X-ServiceStore-StepUp')).toBeFalse();
    req.flush(curation);
    await p;
  });

  it('withdraw WITH a step-up token carries it in X-ServiceStore-StepUp; a blank token sends none', async () => {
    const p1 = service.withdraw('acme.test', 'owncast', 'stepup-tok');
    const r1 = httpMock.expectOne('/bff/superadmin/service-store/acme.test/withdraw');
    expect(r1.request.headers.get('X-ServiceStore-StepUp')).toBe('stepup-tok');
    r1.flush({ ...curation, state: 'withdrawn' });
    await p1;
    const p2 = service.withdraw('acme.test', 'owncast', '   ');
    const r2 = httpMock.expectOne('/bff/superadmin/service-store/acme.test/withdraw');
    expect(r2.request.headers.has('X-ServiceStore-StepUp')).withContext('blank token = no header').toBeFalse();
    r2.flush({ ...curation, state: 'withdrawn' });
    await p2;
  });

  it('an offer 403 with the "requires step-up" contract is ServiceCatalogApiError.isStepUpRequired', async () => {
    const p = service.offer('acme.test', 'owncast');
    httpMock
      .expectOne('/bff/superadmin/service-store/acme.test/offer')
      .flush(
        { error: 'offering a service requires step-up re-authentication (present X-ServiceStore-StepUp)' },
        { status: 403, statusText: 'Forbidden' },
      );
    let caught: unknown;
    try {
      await p;
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ServiceCatalogApiError);
    expect((caught as ServiceCatalogApiError).isStepUpRequired).toBeTrue();
    expect((caught as ServiceCatalogApiError).isForbidden).withContext('it is still a 403').toBeTrue();
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

  it('createProfile 400: the bff bean-validation body {error:"validation failed", fields:{...}} surfaces the FIELD reason, not the constant', async () => {
    // The EXACT body hugmesh-admin-bff-api's ValidationExceptionHandler renders for a
    // failed @Valid AppProfileRequest (the @Size bound on profileJson). The reason is
    // only in `fields`; the top-level `error` is always the constant "validation failed".
    const p = service.createProfile('huge', '{}');
    httpMock.expectOne('/bff/superadmin/app-profiles').flush(
      { error: 'validation failed', fields: { profileJson: 'profileJson is too long' } },
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
    expect((caught as ServiceCatalogApiError).message).toBe('validation failed: profileJson is too long');
  });

  it('createProfile 400: a validation field whose message does not name the field is prefixed with it; several fields are listed', async () => {
    const p = service.createProfile('', '{}');
    httpMock.expectOne('/bff/superadmin/app-profiles').flush(
      { error: 'validation failed', fields: { name: 'invalid', profileJson: 'profileJson is too long' } },
      { status: 400, statusText: 'Bad Request' },
    );
    let caught: unknown;
    try {
      await p;
    } catch (e) {
      caught = e;
    }
    expect((caught as ServiceCatalogApiError).message).toBe(
      'validation failed: name: invalid; profileJson is too long',
    );
  });

  it('createProfile 400: an {error} body WITHOUT fields (ApiException.badRequest channel) is unchanged', async () => {
    const p = service.createProfile('x', '{}');
    httpMock.expectOne('/bff/superadmin/app-profiles').flush(
      { error: 'template rejected: resources.cpu is not a Kubernetes quantity' },
      { status: 400, statusText: 'Bad Request' },
    );
    let caught: unknown;
    try {
      await p;
    } catch (e) {
      caught = e;
    }
    expect((caught as ServiceCatalogApiError).message).toBe(
      'template rejected: resources.cpu is not a Kubernetes quantity',
    );
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

  it('provisionDeployment WITH a step-up token carries it in X-ServiceStore-StepUp', async () => {
    const p = service.provisionDeployment('acme.test', 'dep-1', { sourceKind: 'SELECT', repoUrl: 'r' }, 'stepup-tok');
    const req = httpMock.expectOne('/bff/superadmin/service-store/acme.test/deployments/dep-1/provision');
    expect(req.request.headers.get('X-ServiceStore-StepUp')).toBe('stepup-tok');
    expect(req.request.body).toEqual({ sourceKind: 'SELECT', repoUrl: 'r' });
    req.flush({ ...deployment, propagationState: 'applied' });
    await p;
  });

  it('provisionDeployment WITHOUT a token sends NO X-ServiceStore-StepUp header', async () => {
    const p = service.provisionDeployment('acme.test', 'dep-1', { sourceKind: 'SELECT', repoUrl: 'r' });
    const req = httpMock.expectOne('/bff/superadmin/service-store/acme.test/deployments/dep-1/provision');
    expect(req.request.headers.has('X-ServiceStore-StepUp')).toBeFalse();
    req.flush(deployment);
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

  // ── builder capability pre-flight ─────────────────────────────────────────

  it('builderStatus → GET /bff/superadmin/service-store/builder, both signals TRUE', async () => {
    const p = service.builderStatus();
    const req = httpMock.expectOne('/bff/superadmin/service-store/builder');
    expect(req.request.method).toBe('GET');
    req.flush({ enabled: true, buildNodePresent: true, warnings: [] });
    const status = await p;
    expect(status).toEqual({ enabled: true, buildNodePresent: true, warnings: [] });
  });

  it('builderStatus reports the honest false/false + warnings when the builder is unwired', async () => {
    const p = service.builderStatus();
    const req = httpMock.expectOne('/bff/superadmin/service-store/builder');
    req.flush({
      enabled: false,
      buildNodePresent: false,
      warnings: ['x86 build-node presence could not be detected (Node list failed or was denied); reported absent.'],
    });
    const status = await p;
    expect(status.enabled).toBeFalse();
    expect(status.buildNodePresent).toBeFalse();
    expect(status.warnings).toEqual([
      'x86 build-node presence could not be detected (Node list failed or was denied); reported absent.',
    ]);
  });

  it('builderStatus surfaces a 403 as ServiceCatalogApiError.isForbidden', async () => {
    const p = service.builderStatus();
    const req = httpMock.expectOne('/bff/superadmin/service-store/builder');
    req.flush({ error: 'forbidden' }, { status: 403, statusText: 'Forbidden' });
    await expectAsync(p).toBeRejectedWith(jasmine.objectContaining({ status: 403 }));
  });

  // ── auth + error surfacing ────────────────────────────────────────────────

  it('sends the HttpOnly bff_ cookie (withCredentials) and NO browser Bearer on every call', async () => {
    const p = service.listProfiles();
    const req = httpMock.expectOne('/bff/superadmin/app-profiles');
    expect(req.request.withCredentials).withContext('the bff_ cookie must ride along').toBeTrue();
    expect(req.request.headers.has('Authorization')).withContext('no browser-held Bearer').toBeFalse();
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

  // ── CREATE-AND-FEDERATE WIZARD (ServiceStoreWizardController) ────────────────

  it('listArchetypes → GET /bff/superadmin/service-store/scaffold/archetypes', async () => {
    const p = service.listArchetypes();
    const req = httpMock.expectOne('/bff/superadmin/service-store/scaffold/archetypes');
    expect(req.request.method).toBe('GET');
    req.flush([
      { name: 'spring-bff', displayName: 'Spring Boot BFF', description: 'd', kind: 'backend' },
    ]);
    const rows = await p;
    expect(rows[0].name).toBe('spring-bff');
    expect(rows[0].kind).toBe('backend');
  });

  it('createScaffold → POST /bff/superadmin/service-store/{domain}/scaffold with the body + X-ServiceStore-StepUp header', async () => {
    const p = service.createScaffold(
      'acme.test',
      { serviceKey: 'owncast', displayName: 'Owncast', archetype: 'angular-mfe', mountAt: '/owncast', requiresRole: null },
      'stepup-tok',
    );
    const req = httpMock.expectOne('/bff/superadmin/service-store/acme.test/scaffold');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      serviceKey: 'owncast', displayName: 'Owncast', archetype: 'angular-mfe', mountAt: '/owncast', requiresRole: null,
    });
    expect(req.request.headers.get('X-ServiceStore-StepUp')).withContext('step-up header carried').toBe('stepup-tok');
    req.flush({ id: 'sca-1', domain: 'acme.test', serviceKey: 'owncast', archetype: 'angular-mfe',
      displayName: 'Owncast', mountAt: '/owncast', requiresRole: null, state: 'requested',
      createdBySubject: 'google:root', createdAt: 'T', updatedAt: 'T' }, { status: 201, statusText: 'Created' });
    const row = await p;
    expect(row.id).toBe('sca-1');
    expect(row.state).toBe('requested');
  });

  it('createScaffold WITHOUT a token sends NO X-ServiceStore-StepUp header', async () => {
    const p = service.createScaffold('acme.test', { serviceKey: 'owncast', archetype: 'angular-mfe' });
    const req = httpMock.expectOne('/bff/superadmin/service-store/acme.test/scaffold');
    expect(req.request.headers.has('X-ServiceStore-StepUp')).toBeFalse();
    req.flush({ id: 'sca-1', domain: 'acme.test', serviceKey: 'owncast', archetype: 'angular-mfe',
      displayName: null, mountAt: null, requiresRole: null, state: 'requested',
      createdBySubject: 'google:root', createdAt: 'T', updatedAt: 'T' }, { status: 201, statusText: 'Created' });
    await p;
  });

  it('a scaffold 403 with the "requires step-up" contract is ServiceCatalogApiError.isStepUpRequired', async () => {
    const p = service.createScaffold('acme.test', { serviceKey: 'owncast', archetype: 'angular-mfe' });
    httpMock
      .expectOne('/bff/superadmin/service-store/acme.test/scaffold')
      .flush(
        { error: 'scaffolding a service requires step-up re-authentication (present X-ServiceStore-StepUp)' },
        { status: 403, statusText: 'Forbidden' },
      );
    let caught: unknown;
    try {
      await p;
    } catch (e) {
      caught = e;
    }
    expect(caught instanceof ServiceCatalogApiError).toBeTrue();
    expect((caught as ServiceCatalogApiError).isStepUpRequired).withContext('step-up 403').toBeTrue();
  });

  it('an ordinary superadmin-denial 403 is NOT mistaken for a step-up 403', async () => {
    const p = service.createScaffold('acme.test', { serviceKey: 'owncast', archetype: 'angular-mfe' });
    httpMock
      .expectOne('/bff/superadmin/service-store/acme.test/scaffold')
      .flush({ error: 'forbidden' }, { status: 403, statusText: 'Forbidden' });
    let caught: unknown;
    try {
      await p;
    } catch (e) {
      caught = e;
    }
    expect((caught as ServiceCatalogApiError).isForbidden).toBeTrue();
    expect((caught as ServiceCatalogApiError).isStepUpRequired).withContext('plain deny, not step-up').toBeFalse();
  });

  it('federateDeployment → POST .../deployments/{id}/federate with the body + step-up header, mapping the outcome', async () => {
    const p = service.federateDeployment(
      'acme.test',
      'dep-1',
      {
        slug: 'owncast', mountAt: '/owncast', exposedModule: './routes',
        remoteEntryUrl: 'http://hugmesh-owncast:8080/remoteEntry.json',
        kind: 'remote-shell', visibility: 'internal', requiresRole: null,
      },
      'stepup-tok',
    );
    const req = httpMock.expectOne('/bff/superadmin/service-store/acme.test/deployments/dep-1/federate');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      slug: 'owncast', mountAt: '/owncast', exposedModule: './routes',
      remoteEntryUrl: 'http://hugmesh-owncast:8080/remoteEntry.json',
      kind: 'remote-shell', visibility: 'internal', requiresRole: null,
    });
    expect(req.request.headers.get('X-ServiceStore-StepUp')).toBe('stepup-tok');
    req.flush({ deployment: deployment, federationReal: false, gitopsDescriptorPending: true });
    const outcome = await p;
    expect(outcome.federationReal).withContext('honest: ships dark').toBeFalse();
    expect(outcome.gitopsDescriptorPending).toBeTrue();
    expect(outcome.deployment?.id).toBe('dep-1');
  });

  it('federationStatus → GET /bff/superadmin/service-store/federation → {enabled, warnings}', async () => {
    const p = service.federationStatus();
    const req = httpMock.expectOne('/bff/superadmin/service-store/federation');
    expect(req.request.method).toBe('GET');
    req.flush({ enabled: false, warnings: ['federation registration ships dark'] });
    const status = await p;
    expect(status.enabled).toBeFalse();
    expect(status.warnings).toEqual(['federation registration ships dark']);
  });

  it('scaffoldArchiveUrl builds the direct same-origin GET href (encoded)', () => {
    expect(service.scaffoldArchiveUrl('acme.test', 'sca-1')).toBe(
      '/bff/superadmin/service-store/acme.test/scaffold/sca-1/archive',
    );
  });
  // ── OPTIONAL SERVICES ─────────────────────────────────────────────────────
  //
  // These two go through the generated OptionalServiceSuperadminControllerService
  // (operations optionalServicesCatalogue / optionalServicesSetEnabled, in the committed
  // openapi.json). The assertions below are the wire contract (URL + method + body +
  // auth) and prove the generated client still honours it.

  it('listOptionalServices → GET /bff/superadmin/optional-services', async () => {
    const p = service.listOptionalServices();
    const req = httpMock.expectOne('/bff/superadmin/optional-services');
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).withContext('the bff_ cookie must ride along').toBeTrue();
    expect(req.request.headers.has('Authorization')).withContext('no browser-held Bearer').toBeFalse();
    req.flush([
      {
        slug: 'owncast',
        enabled: true,
        installed: true,
        phase: 'Enabled',
        generation: 2,
        observedGeneration: 2,
        applicationName: 'optional-owncast',
        toggleable: true,
      },
    ]);
    const rows = await p;
    expect(rows.length).toBe(1);
    expect(rows[0].slug).toBe('owncast');
    expect(rows[0].installed).toBeTrue();
    expect(rows[0].toggleable).toBeTrue();
  });

  it('listOptionalServices normalises an ABSENT status.installed to null, not false', async () => {
    const p = service.listOptionalServices();
    httpMock
      .expectOne('/bff/superadmin/optional-services')
      .flush([{ slug: 'character-forge', enabled: true, toggleable: true }]);
    const rows = await p;
    expect(rows[0].enabled).withContext('the request was accepted').toBeTrue();
    expect(rows[0].installed).withContext('but nothing confirmed it').toBeNull();
  });

  it('listOptionalServices REJECTS an UNREADABLE body instead of returning an empty list', async () => {
    // Was flushing `{ services: [] }` and demanding a rejection -- which is exactly the
    // shape hugmesh-admin-bff-api actually sends, so this spec was pinning the very
    // mismatch that made the screen render zero rows against the real BFF. The invariant
    // it MEANT to hold is "a payload we cannot read must not become an empty mesh", so
    // assert that with a body that genuinely has no services array.
    const p = service.listOptionalServices();
    httpMock.expectOne('/bff/superadmin/optional-services').flush({ items: [] });
    await expectAsync(p).toBeRejectedWithError(/services array/i);
  });

  it('listOptionalServices ACCEPTS the admin-bff envelope {reconcilerEnabled, services, note}', async () => {
    const p = service.listOptionalServices();
    httpMock.expectOne('/bff/superadmin/optional-services').flush({
      reconcilerEnabled: false,
      note: 'not wired to a cluster',
      services: [{ slug: 'akkoma', toggleable: true, enabled: true }],
    });
    const rows = await p;
    expect(rows.length).withContext('the real BFF body must parse').toBe(1);
    expect(rows[0].slug).toBe('akkoma');
  });

  it('listOptionalServiceCatalogue carries reconcilerEnabled through to the caller', async () => {
    // A dark reconciler accepts a PUT and actuates NOTHING. A screen that cannot see this
    // flag cannot tell the operator the difference between "done" and "recorded".
    const p = service.listOptionalServiceCatalogue();
    httpMock.expectOne('/bff/superadmin/optional-services').flush({
      reconcilerEnabled: false,
      services: [],
    });
    expect((await p).reconcilerEnabled).toBeFalse();
  });

  it('listOptionalServices surfaces a 404 as ServiceCatalogApiError.isNotFound', async () => {
    const p = service.listOptionalServices();
    httpMock
      .expectOne('/bff/superadmin/optional-services')
      .flush({ message: 'no handler' }, { status: 404, statusText: 'Not Found' });
    let caught: unknown;
    try {
      await p;
    } catch (e) {
      caught = e;
    }
    expect(caught instanceof ServiceCatalogApiError).toBeTrue();
    expect((caught as ServiceCatalogApiError).isNotFound).toBeTrue();
    expect((caught as ServiceCatalogApiError).message).toBe('no handler');
  });

  it('setOptionalServiceEnabled → PUT /bff/superadmin/optional-services/{slug} with {enabled}', async () => {
    const p = service.setOptionalServiceEnabled('games', true);
    const req = httpMock.expectOne('/bff/superadmin/optional-services/games');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ enabled: true });
    expect((req.request.body as any).slug).withContext('slug is the PATH, never the body').toBeUndefined();
    req.flush({ slug: 'games', enabled: true, installed: false, toggleable: true });
    const row = await p;
    expect(row.enabled).toBeTrue();
    expect(row.installed).withContext('the echo still describes the previous generation').toBeFalse();
  });

  it('setOptionalServiceEnabled sends a trimmed audit reason when one is given', async () => {
    const p = service.setOptionalServiceEnabled('games', false, '  retiring the pilot  ');
    const req = httpMock.expectOne('/bff/superadmin/optional-services/games');
    expect(req.request.body).toEqual({ enabled: false, reason: 'retiring the pilot' });
    req.flush({ slug: 'games', enabled: false, toggleable: true });
    await p;
  });

  it('setOptionalServiceEnabled omits `reason` entirely when it is blank', async () => {
    const p = service.setOptionalServiceEnabled('games', true, '   ');
    const req = httpMock.expectOne('/bff/superadmin/optional-services/games');
    expect(req.request.body).toEqual({ enabled: true });
    req.flush({ slug: 'games', enabled: true, toggleable: true });
    await p;
  });

  it('setOptionalServiceEnabled encodes the {slug} path segment safely', async () => {
    const p = service.setOptionalServiceEnabled('a/b edge-ai', true);
    const req = httpMock.expectOne('/bff/superadmin/optional-services/a%2Fb%20edge-ai');
    req.flush({ slug: 'a/b edge-ai', enabled: true, toggleable: true });
    await p;
  });

  it('setOptionalServiceEnabled keeps the slug when the echo omits it', async () => {
    const p = service.setOptionalServiceEnabled('phpbb', true);
    httpMock
      .expectOne('/bff/superadmin/optional-services/phpbb')
      .flush({ enabled: true, toggleable: true });
    const row = await p;
    expect(row.slug).toBe('phpbb');
  });

  it('setOptionalServiceEnabled surfaces a 400 with the server message intact', async () => {
    const p = service.setOptionalServiceEnabled('meshbridge', true);
    httpMock
      .expectOne('/bff/superadmin/optional-services/meshbridge')
      .flush(
        { message: 'spec.slug: Unsupported value: "meshbridge"' },
        { status: 400, statusText: 'Bad Request' },
      );
    let caught: unknown;
    try {
      await p;
    } catch (e) {
      caught = e;
    }
    expect((caught as ServiceCatalogApiError).isBadRequest).toBeTrue();
    expect((caught as ServiceCatalogApiError).message).toBe('spec.slug: Unsupported value: "meshbridge"');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ServiceCatalogCreateServiceComponent } from './service-catalog-create-service.component';
import { ServiceCatalogService, SERVICE_CATALOG_BASE_URL } from './service-catalog.service';
import { bffAuthInterceptor } from './auth.interceptor';

/**
 * Gherkin-readable END-TO-END for the create-and-federate wizard:
 *
 *   FEATURE: A superadmin creates a brand-new service — records a deployment, scaffolds a
 *            starter codebase (step-up), provisions it, and federates its UI — and the wizard
 *            drives the EXACT admin-bff wizard contract through the REAL ServiceCatalogService.
 *
 * Only the network edge is stubbed (Angular {@link HttpTestingController}); the whole stack
 * below the view (view → service → exact bff path/body/header) is exercised. A backing
 * in-memory "bff" 403s the scaffold POST until an X-ServiceStore-StepUp token is presented,
 * so the step-up pause + resume + header-carry is a real observable effect end to end. The
 * requests are drained in WAVES (each POST resolving queues the next in a later microtask).
 *
 * (The role gating + the in-remote /service-catalog/forbidden bounce are proven in
 *  serviceCatalog.guard.spec.ts; this feature spec is the create flow's wire contract.)
 */
const ARCHETYPES = [
  { name: 'spring-bff', displayName: 'Spring Boot BFF', description: 'A runnable Spring Boot BFF.', kind: 'backend' },
  { name: 'angular-mfe', displayName: 'Angular remote (MFE)', description: 'An Angular remote.', kind: 'remote-shell' },
];

describe('FEATURE: Superadmin creates a service (scaffold + federate, e2e)', () => {
  let fixture: ComponentFixture<ServiceCatalogCreateServiceComponent>;
  let component: ServiceCatalogCreateServiceComponent;
  let httpMock: HttpTestingController;

  interface Call {
    url: string;
    method: string;
    body: any;
    stepUp: string | null;
  }
  let urlLog: Call[];

  const DEPLOYMENT = {
    id: 'dep-1', domain: 'acme.test', serviceKey: 'owncast', profileRef: null, state: 'active',
    createdAt: 'T', endingAt: null, enforceActions: null, propagationState: 'pending',
    endedAt: null, createdBySubject: 'google:root',
  };
  const SCAFFOLD = {
    id: 'sca-1', domain: 'acme.test', serviceKey: 'owncast', archetype: 'angular-mfe',
    displayName: null, mountAt: '/owncast', requiresRole: null, state: 'requested',
    createdBySubject: 'google:root', createdAt: 'T', updatedAt: 'T',
  };

  /** Flush every pending request once, applying the fake bff: the four init GETs, then the
   *  apply-chain POSTs. The scaffold POST 403s with the "requires step-up" contract UNTIL an
   *  X-ServiceStore-StepUp header is present, then 201s. Returns how many it flushed so the
   *  caller can drain in waves. */
  function flushOnce(): number {
    const pending = httpMock.match(() => true);
    for (const req of pending) {
      const url = req.request.url;
      const method = req.request.method;
      const stepUp = req.request.headers.get('X-ServiceStore-StepUp');
      urlLog.push({ url, method, body: req.request.body, stepUp });

      if (method === 'GET' && /\/app-profiles$/.test(url)) { req.flush([]); continue; }
      if (method === 'GET' && /\/scaffold\/archetypes$/.test(url)) { req.flush(ARCHETYPES); continue; }
      if (method === 'GET' && /\/service-store\/federation$/.test(url)) {
        req.flush({ enabled: false, warnings: ['federation registration ships dark'] });
        continue;
      }
      if (method === 'GET' && /\/service-store\/builder$/.test(url)) {
        req.flush({ enabled: false, buildNodePresent: false, warnings: [] });
        continue;
      }
      if (method === 'POST' && /\/offer$/.test(url)) {
        req.flush({ id: 'cur-1', domain: 'acme.test', serviceKey: 'owncast', state: 'offered',
          curatedBySubject: 'google:root', createdAt: 'T', updatedAt: 'T' });
        continue;
      }
      if (method === 'POST' && /\/deployments$/.test(url)) { req.flush(DEPLOYMENT); continue; }
      if (method === 'POST' && /\/scaffold$/.test(url)) {
        if (!stepUp) {
          req.flush(
            { error: 'scaffolding a service requires step-up re-authentication (present X-ServiceStore-StepUp)' },
            { status: 403, statusText: 'Forbidden' },
          );
          continue;
        }
        req.flush(SCAFFOLD, { status: 201, statusText: 'Created' });
        continue;
      }
      if (method === 'POST' && /\/provision$/.test(url)) { req.flush(DEPLOYMENT); continue; }
      if (method === 'POST' && /\/federate$/.test(url)) {
        req.flush({ deployment: DEPLOYMENT, federationReal: false, gitopsDescriptorPending: true });
        continue;
      }
      req.flush(null);
    }
    return pending.length;
  }

  /** Run `action` to completion, draining the fake bff in waves. */
  async function withBff(action: Promise<void>): Promise<void> {
    let settled = false;
    const done = action.then(() => { settled = true; });
    for (let i = 0; i < 50; i++) {
      flushOnce();
      await Promise.resolve();
      if (settled && httpMock.match(() => true).length === 0) break;
    }
    flushOnce();
    await done;
  }

  function scaffoldPosts(): Call[] {
    return urlLog.filter((c) => c.method === 'POST' && /\/scaffold$/.test(c.url));
  }
  function lastPost(re: RegExp): Call {
    for (let i = urlLog.length - 1; i >= 0; i--) {
      if (urlLog[i].method === 'POST' && re.test(urlLog[i].url)) return urlLog[i];
    }
    throw new Error(`no POST matching ${re}`);
  }

  /** Navigate the wizard to the review step with a valid identity/archetype/source/federation. */
  function fillToReview(): void {
    component.domain.set('acme.test');
    component.serviceKey.set('owncast');
    component.next();
    component.selectArchetype('angular-mfe');
    component.next();
    component.sourceKind.set('SELECT');
    component.repoUrl.set('https://gitlab.acme.test/svc/owncast.git');
    component.next(); // → federation (defaults filled)
    component.next(); // → review
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.clear();
    urlLog = [];

    await TestBed.configureTestingModule({
      imports: [ServiceCatalogCreateServiceComponent],
      providers: [
        ServiceCatalogService,
        { provide: SERVICE_CATALOG_BASE_URL, useValue: '' },
        provideHttpClient(withInterceptors([bffAuthInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ServiceCatalogCreateServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    flushOnce(); // drain the four on-init GETs
    await Promise.resolve();
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('SCENARIO: the wizard hydrates its archetype catalog + pre-flights on open', () => {
    const gets = urlLog.filter((c) => c.method === 'GET').map((c) => c.url);
    expect(gets).toContain('/bff/superadmin/service-store/scaffold/archetypes');
    expect(gets).toContain('/bff/superadmin/service-store/federation');
    expect(gets).toContain('/bff/superadmin/service-store/builder');
    expect(gets).toContain('/bff/superadmin/app-profiles');
  });

  it('SCENARIO: apply the chain — offer → deployment → scaffold(step-up) → provision → federate, EXACT paths + bodies', async () => {
    fillToReview();

    // The scaffold 403 pauses the chain until a token is supplied.
    await withBff(component.apply());
    fixture.detectChanges();
    expect(component.stepUpChallenge()).withContext('paused on scaffold step-up').not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="service-catalog-create-stepup"]')).not.toBeNull();

    // Supply a token and RESUME.
    component.stepUpTokenInput.set('stepup-tok');
    await withBff(component.submitStepUp());
    fixture.detectChanges();

    // ── offer ──
    const offer = lastPost(/\/offer$/);
    expect(offer.url).toBe('/bff/superadmin/service-store/acme.test/offer');
    expect(offer.body).toEqual({ serviceKey: 'owncast' });

    // ── record deployment ──
    const dep = lastPost(/\/deployments$/);
    expect(dep.url).toBe('/bff/superadmin/service-store/acme.test/deployments');
    expect(dep.body).toEqual({ serviceKey: 'owncast', profileRef: null });

    // ── scaffold: first attempt had NO step-up header (403), retry carried it ──
    const scaffolds = scaffoldPosts();
    expect(scaffolds.length).toBe(2);
    expect(scaffolds[0].url).toBe('/bff/superadmin/service-store/acme.test/scaffold');
    expect(scaffolds[0].stepUp).withContext('first scaffold attempt: no token').toBeNull();
    expect(scaffolds[1].stepUp).withContext('scaffold retry carries the token').toBe('stepup-tok');
    expect(scaffolds[1].body).toEqual({
      serviceKey: 'owncast', displayName: null, archetype: 'angular-mfe', mountAt: '/owncast', requiresRole: null,
    });

    // ── provision ──
    const prov = lastPost(/\/provision$/);
    expect(prov.url).toBe('/bff/superadmin/service-store/acme.test/deployments/dep-1/provision');
    expect(prov.body).toEqual({
      sourceKind: 'SELECT', repoUrl: 'https://gitlab.acme.test/svc/owncast.git', path: null, targetRevision: null,
    });

    // ── federate: reuses the SAME confirmed token ──
    const fed = lastPost(/\/federate$/);
    expect(fed.url).toBe('/bff/superadmin/service-store/acme.test/deployments/dep-1/federate');
    expect(fed.stepUp).withContext('federate reuses the confirmed token').toBe('stepup-tok');
    expect(fed.body).toEqual({
      slug: 'owncast', mountAt: '/owncast', exposedModule: './routes',
      remoteEntryUrl: 'http://hugmesh-owncast:8080/remoteEntry.json',
      kind: 'remote-shell', visibility: 'internal', requiresRole: null,
    });

    // The chain finished and the honest dark note is shown.
    expect(component.applyDone()).toBeTrue();
    expect(fixture.nativeElement.querySelector('[data-testid="service-catalog-create-dark-note"]')).not.toBeNull();
    // The archive download link points at the direct GET endpoint.
    const link = fixture.nativeElement.querySelector('[data-testid="service-catalog-create-archive-link"]') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/bff/superadmin/service-store/acme.test/scaffold/sca-1/archive');
  });

  it('SCENARIO: the request ORDER is offer, deployment, scaffold, provision, federate', async () => {
    fillToReview();
    await withBff(component.apply());
    component.stepUpTokenInput.set('stepup-tok');
    await withBff(component.submitStepUp());

    const posts = urlLog
      .filter((c) => c.method === 'POST')
      .map((c) =>
        /\/offer$/.test(c.url) ? 'offer'
        : /\/deployments$/.test(c.url) ? 'deployment'
        : /\/scaffold$/.test(c.url) ? 'scaffold'
        : /\/provision$/.test(c.url) ? 'provision'
        : /\/federate$/.test(c.url) ? 'federate'
        : 'other',
      );
    // The first scaffold (403) + the retry both appear; the ordering is still the chain order.
    expect(posts).toEqual(['offer', 'deployment', 'scaffold', 'scaffold', 'provision', 'federate']);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ServiceCatalogAddServiceComponent } from './service-catalog-add-service.component';
import { ServiceCatalogService, SERVICE_CATALOG_BASE_URL, ServiceDeployment } from './service-catalog.service';
import { bffAuthInterceptor } from './auth.interceptor';

/**
 * Gherkin-readable END-TO-END for the Service Catalog headline flow:
 *
 *   FEATURE: A superadmin adds a service to a domain via each of the four sources
 *            and sees it reflected in the domain's app profile (its deployment rows).
 *
 * This drives the REAL ServiceCatalogAddServiceComponent through the REAL ServiceCatalogService,
 * with ONLY the network edge stubbed — so the whole stack below the view
 * (view → service → exact bff path/body) is exercised against the admin-bff effector
 * PR #67 contract, not a mocked service:
 *   GET  /bff/superadmin/service-store/{domain}/deployments        → the app profile rows
 *   POST /bff/superadmin/service-store/{domain}/deployments/{id}/provision {sourceKind, repoUrl,…}
 *
 * Since the ng-openapi-gen migration the service delegates to the generated typed
 * HttpClient client, so the network edge is the Angular {@link HttpTestingController}
 * (was a `fetch` stub). A backing in-memory "bff" flips a row's propagation_state
 * pending→applied on provision, so "see it in the app profile" is a real observable
 * effect, end to end — the wire contract (paths + bodies) is unchanged.
 *
 * (The SUPERADMIN route gating + the in-remote /service-catalog/forbidden bounce are proven
 *  end-to-end in serviceCatalog.guard.spec.ts; this feature spec is the service-add flow.)
 */
describe('FEATURE: Superadmin adds a service via the four sources (e2e)', () => {
  let fixture: ComponentFixture<ServiceCatalogAddServiceComponent>;
  let component: ServiceCatalogAddServiceComponent;
  let httpMock: HttpTestingController;

  /** The in-memory app-profile (deployment rows) the fake bff serves + mutates. */
  let bffRows: ServiceDeployment[];
  /** Every URL the flow hit, in order (the migrated stand-in for the fetch-spy log). */
  let urlLog: { url: string; method: string; body: any }[];

  function bffRow(id: string, key: string): ServiceDeployment {
    return {
      id, domain: 'acme.test', serviceKey: key, profileRef: null, state: 'active',
      createdAt: 'T', endingAt: null, enforceActions: null, propagationState: 'pending',
      endedAt: null, createdBySubject: 'google:root',
    };
  }

  /** Flush every pending HttpClient request once, applying the fake bff: GET
   *  deployments returns bffRows; POST .../provision flips the addressed row
   *  pending→applied (the real effect a superadmin would observe). Returns how many
   *  it flushed so the caller can drain in waves (a provision POST resolving then
   *  queues the reload GETs in a later microtask). */
  function flushOnce(): number {
    const pending = httpMock.match(() => true);
    for (const req of pending) {
      const url = req.request.url;
      const method = req.request.method;
      urlLog.push({ url, method, body: req.request.body });
      const provision = /\/deployments\/([^/]+)\/provision$/.exec(url);
      if (method === 'POST' && provision) {
        const id = decodeURIComponent(provision[1]);
        const target = bffRows.find((r) => r.id === id);
        if (!target) {
          req.flush({ message: 'no deployment' }, { status: 404, statusText: 'Not Found' });
          continue;
        }
        target.propagationState = 'applied';
        req.flush(target);
        continue;
      }
      if (method === 'GET' && /\/deployments$/.test(url)) {
        req.flush(bffRows);
        continue;
      }
      if (method === 'GET' && /\/app-profiles$/.test(url)) {
        req.flush([]);
        continue;
      }
      req.flush(null);
    }
    return pending.length;
  }

  /** Run `action` to completion, draining the fake bff in waves (each wave yields a
   *  microtask so a request queued by a just-resolved one is picked up). */
  async function withBff(action: Promise<void>): Promise<void> {
    let settled = false;
    const done = action.then(() => { settled = true; });
    // Drain until the action settled AND no further requests appear.
    for (let i = 0; i < 50; i++) {
      flushOnce();
      await Promise.resolve();
      if (settled && httpMock.match(() => true).length === 0) break;
    }
    flushOnce();
    await done;
  }

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }
  function setInput(id: string, value: string): void {
    const node = el().querySelector('#' + id) as HTMLInputElement;
    node.value = value;
    node.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }
  function click(node: Element | null): void {
    (node as HTMLElement).click();
    fixture.detectChanges();
  }

  /** GIVEN a superadmin loads a domain's app profile (its recorded deployments). The
   *  domain field is filled, then the real loadDomain() drives the real GET through
   *  the real ServiceCatalogService to the test backend. */
  async function givenLoadedDomain(domain = 'acme.test'): Promise<void> {
    setInput('service-catalog-add-domain', domain);
    component.domain.set(domain); // ensure the signal is set deterministically
    await withBff(component.loadDomain());
    fixture.detectChanges();
  }
  /** WHEN they choose the Nth recorded deployment to provision. */
  function whenChooseRow(index: number): void {
    const buttons = el().querySelectorAll('[data-testid="service-catalog-add-list"] tbody tr button');
    click(buttons[index]);
  }
  async function whenProvision(): Promise<void> {
    await withBff(component.provision());
    fixture.detectChanges();
  }
  /** The single provision POST the flow issued. */
  function provisionCall(): { url: string; body: any } {
    for (let i = urlLog.length - 1; i >= 0; i--) {
      const c = urlLog[i];
      if (/\/provision$/.test(c.url) && c.method === 'POST') {
        return { url: c.url, body: c.body };
      }
    }
    throw new Error('no provision POST was issued');
  }

  beforeEach(async () => {
    localStorage.clear();
    bffRows = [bffRow('dep-1', 'owncast'), bffRow('dep-2', 'phpbb')];
    urlLog = [];

    await TestBed.configureTestingModule({
      imports: [ServiceCatalogAddServiceComponent],
      providers: [
        ServiceCatalogService,
        { provide: SERVICE_CATALOG_BASE_URL, useValue: '' },
        provideHttpClient(withInterceptors([bffAuthInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ServiceCatalogAddServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    flushOnce(); // any on-init load
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('SCENARIO: add a service via the SELECT source and see it APPLIED in the app profile', async () => {
    // GIVEN the domain's app profile is loaded (real GET hits the bff path)
    await givenLoadedDomain('acme.test');
    expect(el().querySelector('[data-testid="service-catalog-add-list"]')).not.toBeNull();
    expect(el().textContent).toContain('owncast');

    // WHEN the superadmin chooses owncast and provisions it from the SELECT (catalog) source
    whenChooseRow(0);
    expect(el().querySelector('[data-testid="service-catalog-source-SELECT"]')).not.toBeNull();
    setInput('service-catalog-source-repo', 'https://git.acme.test/catalog/owncast.git');
    component.repoUrl.set('https://git.acme.test/catalog/owncast.git');
    await whenProvision();

    // THEN the provision POST hit the EXACT effector path with the SELECT body
    const select = provisionCall();
    expect(select.url).toBe('/bff/superadmin/service-store/acme.test/deployments/dep-1/provision');
    expect(select.body.sourceKind).toBe('SELECT');
    expect(select.body.repoUrl).toBe('https://git.acme.test/catalog/owncast.git');

    // AND a success notice is shown
    expect(el().querySelector('[data-testid="service-catalog-add-notice"]')).not.toBeNull();
    // AND the app profile now reflects the row APPLIED (the real observable effect)
    expect(bffRows.find((r) => r.id === 'dep-1')!.propagationState).toBe('applied');
    expect(el().querySelector('[data-testid="service-catalog-add-list"]')!.textContent).toContain('applied');
  });

  it('SCENARIO: add a service via the GIT source with path + revision', async () => {
    // GIVEN a loaded domain and the second recorded deployment chosen
    await givenLoadedDomain('acme.test');
    whenChooseRow(1); // dep-2 phpbb

    // WHEN they pick the GIT source and fill the GitOps coordinates
    click(el().querySelector('[data-testid="service-catalog-source-GIT"] input[type="radio"]'));
    component.sourceKind.set('GIT');
    setInput('service-catalog-source-repo', 'https://gitlab.acme.test/svc/phpbb.git');
    component.repoUrl.set('https://gitlab.acme.test/svc/phpbb.git');
    setInput('service-catalog-source-path', 'deploy/');
    component.path.set('deploy/');
    setInput('service-catalog-source-rev', 'main');
    component.targetRevision.set('main');
    await whenProvision();

    // THEN the GIT body carried path + revision to the dep-2 provision path
    const git = provisionCall();
    expect(git.url).toBe('/bff/superadmin/service-store/acme.test/deployments/dep-2/provision');
    expect(git.body).toEqual({
      sourceKind: 'GIT', repoUrl: 'https://gitlab.acme.test/svc/phpbb.git', path: 'deploy/', targetRevision: 'main',
    });
  });

  it('SCENARIO: the DOCKERFILE + ZIP sources are offered but DISABLED (ships dark — needs the Kaniko builder)', async () => {
    // GIVEN a loaded domain and a chosen deployment
    await givenLoadedDomain('acme.test');
    whenChooseRow(0);

    // THEN all four sources are present; the two builder-gated ones are disabled and badged
    const dockerfile = el().querySelector('[data-testid="service-catalog-source-DOCKERFILE"] input') as HTMLInputElement;
    const zip = el().querySelector('[data-testid="service-catalog-source-ZIP"] input') as HTMLInputElement;
    expect(dockerfile.disabled).toBeTrue();
    expect(zip.disabled).toBeTrue();
    expect(el().querySelectorAll('[data-testid="service-catalog-source-gated-badge"]').length).toBe(2);
    // AND no provision POST has been issued
    expect(urlLog.some((c) => /\/provision$/.test(c.url))).toBeFalse();
  });

  it('SCENARIO: switching the domain re-scopes the app profile (cross-domain isolation)', async () => {
    // GIVEN acme.test loaded
    await givenLoadedDomain('acme.test');
    expect(el().textContent).toContain('owncast');

    // WHEN the bff serves a different brand's rows and the superadmin loads beta.test
    bffRows = [bffRow('b-1', 'matrix')];
    await givenLoadedDomain('beta.test');

    // THEN only beta.test's rows show, the prior selection is cleared, and the GET targeted beta.test
    expect(component.loadedDomain()).toBe('beta.test');
    expect(component.selectedId()).toBe('');
    expect(el().textContent).toContain('matrix');
    expect(el().textContent).not.toContain('owncast');
    const getCalls = urlLog.map((c) => c.url).filter((u) => /\/deployments$/.test(u));
    expect(getCalls).toContain('/bff/superadmin/service-store/beta.test/deployments');
  });
});

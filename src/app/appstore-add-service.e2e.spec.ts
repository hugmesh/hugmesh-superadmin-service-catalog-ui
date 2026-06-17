import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppstoreAddServiceComponent } from './appstore-add-service.component';
import { AppstoreService, APPSTORE_BASE_URL, ServiceDeployment } from './appstore.service';

/**
 * Gherkin-readable END-TO-END for the App-Store headline flow:
 *
 *   FEATURE: A superadmin adds a service to a domain via each of the four sources
 *            and sees it reflected in the domain's app profile (its deployment rows).
 *
 * This drives the REAL AppstoreAddServiceComponent through the REAL AppstoreService,
 * with ONLY `fetch` stubbed at the network edge — so the whole stack below the view
 * (view → service → exact bff path/body) is exercised against the admin-bff effector
 * PR #67 contract, not a mocked service:
 *   GET  /bff/superadmin/service-store/{domain}/deployments        → the app profile rows
 *   POST /bff/superadmin/service-store/{domain}/deployments/{id}/provision {sourceKind, repoUrl,…}
 *
 * A backing in-memory "bff" flips a row's propagation_state pending→applied on provision,
 * so "see it in the app profile" is a real observable effect, end to end.
 *
 * (The SUPERADMIN route gating + the in-remote /appstore/forbidden bounce are proven
 *  end-to-end in appstore.guard.spec.ts; this feature spec is the service-add flow.)
 */
describe('FEATURE: Superadmin adds a service via the four sources (e2e)', () => {
  let fixture: ComponentFixture<AppstoreAddServiceComponent>;
  let component: AppstoreAddServiceComponent;
  let fetchSpy: jasmine.Spy;

  /** The in-memory app-profile (deployment rows) the fake bff serves + mutates. */
  let bffRows: ServiceDeployment[];

  function bffRow(id: string, key: string): ServiceDeployment {
    return {
      id, domain: 'acme.test', serviceKey: key, profileRef: null, state: 'active',
      createdAt: 'T', endingAt: null, enforceActions: null, propagationState: 'pending',
      endedAt: null, createdBySubject: 'google:root',
    };
  }
  function json(body: unknown, status = 200): Response {
    return {
      ok: status >= 200 && status < 300, status,
      text: () => Promise.resolve(body === undefined ? '' : JSON.stringify(body)),
    } as unknown as Response;
  }

  /** Wire the fake bff: GET deployments returns bffRows; POST .../provision flips the
   *  addressed row pending→applied (the real effect a superadmin would observe). */
  function installFakeBff(): void {
    fetchSpy.and.callFake((url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      const provision = /\/deployments\/([^/]+)\/provision$/.exec(url);
      if (method === 'POST' && provision) {
        const id = decodeURIComponent(provision[1]);
        const target = bffRows.find((r) => r.id === id);
        if (!target) return Promise.resolve(json({ message: 'no deployment' }, 404));
        target.propagationState = 'applied';
        return Promise.resolve(json(target));
      }
      if (method === 'GET' && /\/deployments$/.test(url)) {
        return Promise.resolve(json(bffRows));
      }
      if (method === 'GET' && /\/app-profiles$/.test(url)) {
        return Promise.resolve(json([]));
      }
      return Promise.resolve(json(undefined));
    });
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
   *  the real AppstoreService to the stubbed fetch. */
  async function givenLoadedDomain(domain = 'acme.test'): Promise<void> {
    setInput('appstore-add-domain', domain);
    component.domain.set(domain); // ensure the signal is set deterministically
    await component.loadDomain();
    fixture.detectChanges();
  }
  /** WHEN they choose the Nth recorded deployment to provision. */
  function whenChooseRow(index: number): void {
    const buttons = el().querySelectorAll('[data-testid="appstore-add-list"] tbody tr button');
    click(buttons[index]);
  }
  async function whenProvision(): Promise<void> {
    await component.provision();
    fixture.detectChanges();
  }
  /** The single provision POST the flow issued (the most-recent call is the
   *  post-provision reload GET, so find the POST .../provision explicitly). */
  function provisionCall(): { url: string; body: any } {
    for (let i = fetchSpy.calls.count() - 1; i >= 0; i--) {
      const args = fetchSpy.calls.argsFor(i);
      const url = args[0] as string;
      const init = (args[1] ?? {}) as RequestInit;
      if (/\/provision$/.test(url) && (init.method ?? 'GET') === 'POST') {
        return { url, body: JSON.parse(init.body as string) };
      }
    }
    throw new Error('no provision POST was issued');
  }

  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem('snap.session', JSON.stringify({ bffToken: 'tok' }));
    bffRows = [bffRow('dep-1', 'owncast'), bffRow('dep-2', 'phpbb')];
    fetchSpy = spyOn(globalThis, 'fetch');
    installFakeBff();

    await TestBed.configureTestingModule({
      imports: [AppstoreAddServiceComponent],
      providers: [AppstoreService, { provide: APPSTORE_BASE_URL, useValue: '' }],
    }).compileComponents();
    fixture = TestBed.createComponent(AppstoreAddServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('SCENARIO: add a service via the SELECT source and see it APPLIED in the app profile', async () => {
    // GIVEN the domain's app profile is loaded (real GET hits the bff path)
    await givenLoadedDomain('acme.test');
    expect(el().querySelector('[data-testid="appstore-add-list"]')).not.toBeNull();
    expect(el().textContent).toContain('owncast');

    // WHEN the superadmin chooses owncast and provisions it from the SELECT (catalog) source
    whenChooseRow(0);
    expect(el().querySelector('[data-testid="appstore-source-SELECT"]')).not.toBeNull();
    setInput('appstore-source-repo', 'https://git.acme.test/catalog/owncast.git');
    component.repoUrl.set('https://git.acme.test/catalog/owncast.git');
    await whenProvision();

    // THEN the provision POST hit the EXACT effector path with the SELECT body
    const select = provisionCall();
    expect(select.url).toBe('/bff/superadmin/service-store/acme.test/deployments/dep-1/provision');
    expect(select.body.sourceKind).toBe('SELECT');
    expect(select.body.repoUrl).toBe('https://git.acme.test/catalog/owncast.git');

    // AND a success notice is shown
    expect(el().querySelector('[data-testid="appstore-add-notice"]')).not.toBeNull();
    // AND the app profile now reflects the row APPLIED (the real observable effect)
    expect(bffRows.find((r) => r.id === 'dep-1')!.propagationState).toBe('applied');
    expect(el().querySelector('[data-testid="appstore-add-list"]')!.textContent).toContain('applied');
  });

  it('SCENARIO: add a service via the GIT source with path + revision', async () => {
    // GIVEN a loaded domain and the second recorded deployment chosen
    await givenLoadedDomain('acme.test');
    whenChooseRow(1); // dep-2 phpbb

    // WHEN they pick the GIT source and fill the GitOps coordinates
    click(el().querySelector('[data-testid="appstore-source-GIT"] input[type="radio"]'));
    component.sourceKind.set('GIT');
    setInput('appstore-source-repo', 'https://gitlab.acme.test/svc/phpbb.git');
    component.repoUrl.set('https://gitlab.acme.test/svc/phpbb.git');
    setInput('appstore-source-path', 'deploy/');
    component.path.set('deploy/');
    setInput('appstore-source-rev', 'main');
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
    const dockerfile = el().querySelector('[data-testid="appstore-source-DOCKERFILE"] input') as HTMLInputElement;
    const zip = el().querySelector('[data-testid="appstore-source-ZIP"] input') as HTMLInputElement;
    expect(dockerfile.disabled).toBeTrue();
    expect(zip.disabled).toBeTrue();
    expect(el().querySelectorAll('[data-testid="appstore-source-gated-badge"]').length).toBe(2);
    // AND no provision POST has been issued
    expect(fetchSpy.calls.all().some((c) => /\/provision$/.test(c.args[0] as string))).toBeFalse();
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
    const getCalls = fetchSpy.calls.all().map((c) => c.args[0] as string).filter((u) => /\/deployments$/.test(u));
    expect(getCalls).toContain('/bff/superadmin/service-store/beta.test/deployments');
  });
});

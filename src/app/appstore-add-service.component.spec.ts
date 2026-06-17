import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppstoreAddServiceComponent } from './appstore-add-service.component';
import { AppstoreService, ServiceDeployment, AppstoreApiError } from './appstore.service';
import { accessibleName } from './accessible-name';

/**
 * The ADD-A-SERVICE view — the headline 4-source provision flow over the admin-bff
 * AddService effector (PR #67):
 *   POST /bff/superadmin/service-store/{domain}/deployments/{id}/provision
 *        {sourceKind, repoUrl, path?, targetRevision?}
 *
 * The spec covers, against the platform test standard:
 *   - the EXACT call (domain+id in the PATH, the source body) for SELECT + GIT;
 *   - the SHIPS-DARK degrade: DOCKERFILE/ZIP radios DISABLED, the submit guarded,
 *     and the bff 400 (the Kaniko-builder guard) surfaced verbatim;
 *   - cross-domain: provisioning targets the explicit {domain} PATH, never a body
 *     field, and switching domains re-scopes the row list;
 *   - concurrent-CAS: a 404 (the row provisioned/ended out from under us) degrades;
 *   - graceful 403/404 on the row LOAD;
 *   - a11y: every interactive control has an accessible name.
 */
function dep(id: string, key: string, state = 'active', propagationState = 'pending'): ServiceDeployment {
  return {
    id,
    domain: 'acme.test',
    serviceKey: key,
    profileRef: null,
    state,
    createdAt: 'T',
    endingAt: null,
    enforceActions: null,
    propagationState,
    endedAt: null,
    createdBySubject: 'google:root',
  };
}

describe('AppstoreAddServiceComponent (4-source provision over effector PR #67)', () => {
  let fixture: ComponentFixture<AppstoreAddServiceComponent>;
  let component: AppstoreAddServiceComponent;
  let appstore: jasmine.SpyObj<
    Pick<AppstoreService, 'listDeployments' | 'listProfiles' | 'provisionDeployment'>
  >;

  beforeEach(async () => {
    appstore = jasmine.createSpyObj('AppstoreService', [
      'listDeployments',
      'listProfiles',
      'provisionDeployment',
    ]);
    appstore.listDeployments.and.resolveTo([dep('dep-1', 'owncast')]);
    appstore.listProfiles.and.resolveTo([]);
    appstore.provisionDeployment.and.resolveTo(dep('dep-1', 'owncast', 'active', 'applied'));

    await TestBed.configureTestingModule({
      imports: [AppstoreAddServiceComponent],
      providers: [{ provide: AppstoreService, useValue: appstore }],
    }).compileComponents();
    fixture = TestBed.createComponent(AppstoreAddServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }
  async function loadDomain(d = 'acme.test'): Promise<void> {
    component.domain.set(d);
    await component.loadDomain();
    fixture.detectChanges();
  }
  function selectFirst(): void {
    component.select(component.rows()![0]);
    fixture.detectChanges();
  }

  // ── the list ──────────────────────────────────────────────────────────────

  it('loadDomain lists the domain deployments by the explicit {domain} PATH', async () => {
    await loadDomain('acme.test');
    expect(appstore.listDeployments).toHaveBeenCalledWith('acme.test');
    expect(el().querySelector('[data-testid="appstore-add-list"]')).not.toBeNull();
  });

  it('shows the EMPTY state (record one first) when the domain has no deployments', async () => {
    appstore.listDeployments.and.resolveTo([]);
    await loadDomain();
    expect(el().querySelector('[data-testid="appstore-add-empty"]')).not.toBeNull();
  });

  // ── the four source options ─────────────────────────────────────────────────

  it('renders ALL FOUR source options, with DOCKERFILE + ZIP disabled (builder-gated)', async () => {
    await loadDomain();
    selectFirst();
    const radios = Array.from(
      el().querySelectorAll('input[type="radio"][name="sourceKind"]'),
    ) as HTMLInputElement[];
    const byValue = new Map(radios.map((r) => [r.value, r]));
    expect([...byValue.keys()].sort()).toEqual(['DOCKERFILE', 'GIT', 'SELECT', 'ZIP']);
    expect(byValue.get('SELECT')!.disabled).withContext('SELECT live').toBeFalse();
    expect(byValue.get('GIT')!.disabled).withContext('GIT live').toBeFalse();
    expect(byValue.get('DOCKERFILE')!.disabled).withContext('DOCKERFILE gated').toBeTrue();
    expect(byValue.get('ZIP')!.disabled).withContext('ZIP gated').toBeTrue();
  });

  it('shows the "needs builder" badge on the two gated sources', async () => {
    await loadDomain();
    selectFirst();
    const badges = el().querySelectorAll('[data-testid="appstore-source-gated-badge"]');
    expect(badges.length).toBe(2);
  });

  // ── SELECT + GIT provision (the live sources) ─────────────────────────────────

  it('provisions a SELECT source — POSTs {sourceKind:SELECT, repoUrl} to {domain}/{id}/provision', async () => {
    await loadDomain('acme.test');
    selectFirst();
    component.sourceKind.set('SELECT');
    component.repoUrl.set('https://git.acme.test/catalog/owncast.git');
    await component.provision();
    fixture.detectChanges();
    expect(appstore.provisionDeployment).toHaveBeenCalledWith('acme.test', 'dep-1', {
      sourceKind: 'SELECT',
      repoUrl: 'https://git.acme.test/catalog/owncast.git',
      path: null,
      targetRevision: null,
    });
    expect(el().querySelector('[data-testid="appstore-add-notice"]')).not.toBeNull();
  });

  it('provisions a GIT source with optional path + targetRevision', async () => {
    await loadDomain('acme.test');
    selectFirst();
    component.sourceKind.set('GIT');
    component.repoUrl.set('https://gitlab.acme.test/svc/owncast.git');
    component.path.set('deploy/');
    component.targetRevision.set('main');
    await component.provision();
    expect(appstore.provisionDeployment).toHaveBeenCalledWith('acme.test', 'dep-1', {
      sourceKind: 'GIT',
      repoUrl: 'https://gitlab.acme.test/svc/owncast.git',
      path: 'deploy/',
      targetRevision: 'main',
    });
  });

  it('reloads the row list after a successful provision (to pick up the propagation state)', async () => {
    await loadDomain('acme.test');
    selectFirst();
    component.repoUrl.set('r');
    appstore.listDeployments.calls.reset();
    await component.provision();
    expect(appstore.listDeployments).toHaveBeenCalledWith('acme.test');
  });

  it('does NOT provision when the repoUrl is blank (the @NotBlank contract)', async () => {
    await loadDomain('acme.test');
    selectFirst();
    component.repoUrl.set('   ');
    await component.provision();
    expect(appstore.provisionDeployment).not.toHaveBeenCalled();
  });

  // ── SHIPS-DARK degrade: the builder-gated sources ─────────────────────────────

  it('chooseSource() ignores a builder-gated kind (DOCKERFILE/ZIP cannot be selected)', () => {
    component.sourceKind.set('SELECT');
    component.chooseSource('DOCKERFILE');
    expect(component.sourceKind()).toBe('SELECT');
    component.chooseSource('ZIP');
    expect(component.sourceKind()).toBe('SELECT');
    component.chooseSource('GIT');
    expect(component.sourceKind()).toBe('GIT');
  });

  it('NEVER POSTs a builder-gated source even if one is forced (defence-in-depth) + explains', async () => {
    await loadDomain('acme.test');
    selectFirst();
    component.sourceKind.set('DOCKERFILE'); // force past the disabled radio
    component.repoUrl.set('r');
    await component.provision();
    fixture.detectChanges();
    expect(appstore.provisionDeployment).not.toHaveBeenCalled();
    const err = el().querySelector('[data-testid="appstore-add-form-error"]')!;
    expect(err).not.toBeNull();
    expect(err.textContent).toContain('Kaniko');
  });

  it('shows the gated-source notice in the form when a builder-gated source is active', async () => {
    await loadDomain('acme.test');
    selectFirst();
    component.sourceKind.set('ZIP');
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="appstore-source-gated-notice"]')).not.toBeNull();
  });

  it('surfaces the bff 400 (the server-authoritative Kaniko guard) VERBATIM', async () => {
    await loadDomain('acme.test');
    selectFirst();
    component.sourceKind.set('GIT'); // a live source the UI allows
    component.repoUrl.set('r');
    appstore.provisionDeployment.and.rejectWith(
      new AppstoreApiError(
        400,
        'service source DOCKERFILE requires the in-cluster image builder (Kaniko) which is not yet available',
      ),
    );
    await component.provision();
    fixture.detectChanges();
    const err = el().querySelector('[data-testid="appstore-add-form-error"]')!;
    expect(err.textContent).toContain('Kaniko');
  });

  // ── cross-domain isolation ────────────────────────────────────────────────────

  it('provision targets the explicit {domain} PATH, NEVER a body field', async () => {
    await loadDomain('beta.test');
    selectFirst();
    component.repoUrl.set('r');
    await component.provision();
    const [domainArg, , body] = appstore.provisionDeployment.calls.mostRecent().args;
    expect(domainArg).toBe('beta.test');
    expect((body as unknown as Record<string, unknown>)['domain']).toBeUndefined();
  });

  it('switching the domain re-scopes the row list (no leak across domains)', async () => {
    await loadDomain('acme.test');
    expect(appstore.listDeployments).toHaveBeenCalledWith('acme.test');
    appstore.listDeployments.and.resolveTo([dep('dep-9', 'forum')]);
    await loadDomain('beta.test');
    expect(appstore.listDeployments).toHaveBeenCalledWith('beta.test');
    expect(component.selectedId()).withContext('selection cleared on domain switch').toBe('');
    expect(component.rows()![0].serviceKey).toBe('forum');
  });

  // ── concurrent-CAS: the row changed under us ──────────────────────────────────

  it('degrades a 404 on provision (the row was provisioned/ended concurrently) with a reload hint', async () => {
    await loadDomain('acme.test');
    selectFirst();
    component.repoUrl.set('r');
    appstore.provisionDeployment.and.rejectWith(new AppstoreApiError(404, 'no deployment'));
    await component.provision();
    fixture.detectChanges();
    const err = el().querySelector('[data-testid="appstore-add-form-error"]')!;
    expect(err.textContent).toContain('reload');
  });

  // ── graceful auth degrade on the LOAD ─────────────────────────────────────────

  it('degrades a 403 on the row LOAD to the empty state (graceful, not a scary error)', async () => {
    appstore.listDeployments.and.rejectWith(new AppstoreApiError(403, 'forbidden'));
    await loadDomain('acme.test');
    expect(el().querySelector('[data-testid="appstore-add-empty"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="appstore-add-list-error"]')).toBeNull();
  });

  it('shows the ERROR state on a non-auth load failure (with a Retry)', async () => {
    appstore.listDeployments.and.rejectWith(new AppstoreApiError(500, 'boom'));
    await loadDomain('acme.test');
    expect(el().querySelector('[data-testid="appstore-add-list-error"]')).not.toBeNull();
  });

  it('surfaces a 403 on PROVISION as a clear superadmin-required action error', async () => {
    await loadDomain('acme.test');
    selectFirst();
    component.repoUrl.set('r');
    appstore.provisionDeployment.and.rejectWith(new AppstoreApiError(403, 'forbidden'));
    await component.provision();
    fixture.detectChanges();
    const err = el().querySelector('[data-testid="appstore-add-form-error"]')!;
    expect(err.textContent).toContain('superadmin');
  });

  // ── a11y ──────────────────────────────────────────────────────────────────────

  it('every interactive control has an accessible name (a11y)', async () => {
    await loadDomain('acme.test');
    selectFirst();
    const controls = Array.from(
      el().querySelectorAll('input, button, [role="radio"]'),
    ) as HTMLElement[];
    expect(controls.length).toBeGreaterThan(0);
    for (const c of controls) {
      expect(accessibleName(c)).withContext(c.outerHTML).toBeTruthy();
    }
  });
});

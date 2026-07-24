import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceCatalogCreateServiceComponent } from './service-catalog-create-service.component';
import {
  ServiceCatalogService,
  ServiceCatalogApiError,
  ScaffoldArchetype,
  ServiceScaffold,
  ServiceDeployment,
  FederateOutcome,
} from './service-catalog.service';
import { accessibleName } from './accessible-name';

/**
 * The CREATE-AND-FEDERATE wizard — the SUPERADMIN scaffold+federate flow over the
 * admin-bff ServiceStoreWizardController. The spec drives the REAL component through a
 * spied {@link ServiceCatalogService}, covering, against the platform test standard:
 *   - step gating: next() blocks on an invalid step + advances on a valid one;
 *   - archetype validation: the spring-bff Java-package slug rule (surfaced BEFORE submit);
 *   - source pre-flight gating: DOCKERFILE/ZIP disabled until the live builder is ready;
 *   - the federation ships-dark pre-flight note;
 *   - the APPLY chain: the EXACT sequential service calls (offer→deployment→scaffold→
 *     provision→federate) with the derived bodies, offer/federate honouring the toggles;
 *   - step-up: a scaffold 403 "requires step-up" pauses the chain, and confirming a token
 *     RESUMES the same chain carrying X-ServiceStore-StepUp into scaffold + federate;
 *   - honesty: federationReal=false / gitopsDescriptorPending=true render the dark note;
 *   - the archive download link + bff-400-verbatim error surfacing;
 *   - a11y: every interactive control has an accessible name.
 */
const ARCHETYPES: ScaffoldArchetype[] = [
  { name: 'spring-bff', displayName: 'Spring Boot BFF', description: 'A runnable Spring Boot BFF.', kind: 'backend' },
  { name: 'angular-mfe', displayName: 'Angular remote (MFE)', description: 'An Angular remote exposing ./routes.', kind: 'remote-shell' },
  { name: 'remote-fragment', displayName: 'Remote fragment', description: 'A profile fragment starter.', kind: 'fragment' },
];

function scaffoldRow(overrides: Partial<ServiceScaffold> = {}): ServiceScaffold {
  return {
    id: 'sca-1',
    domain: 'acme.test',
    serviceKey: 'owncast',
    archetype: 'angular-mfe',
    displayName: null,
    mountAt: '/owncast',
    requiresRole: null,
    state: 'requested',
    createdBySubject: 'google:root',
    createdAt: 'T',
    updatedAt: 'T',
    ...overrides,
  };
}

function deploymentRow(id = 'dep-1'): ServiceDeployment {
  return {
    id,
    domain: 'acme.test',
    serviceKey: 'owncast',
    profileRef: null,
    state: 'active',
    createdAt: 'T',
    endingAt: null,
    enforceActions: null,
    propagationState: 'pending',
    endedAt: null,
    createdBySubject: 'google:root',
  };
}

function federateOutcome(overrides: Partial<FederateOutcome> = {}): FederateOutcome {
  return {
    deployment: deploymentRow(),
    federationReal: false,
    gitopsDescriptorPending: true,
    ...overrides,
  };
}

describe('ServiceCatalogCreateServiceComponent (scaffold + federate wizard)', () => {
  let fixture: ComponentFixture<ServiceCatalogCreateServiceComponent>;
  let component: ServiceCatalogCreateServiceComponent;
  let serviceCatalog: jasmine.SpyObj<
    Pick<
      ServiceCatalogService,
      | 'listProfiles'
      | 'listArchetypes'
      | 'federationStatus'
      | 'builderStatus'
      | 'offer'
      | 'createDeployment'
      | 'createScaffold'
      | 'provisionDeployment'
      | 'federateDeployment'
      | 'scaffoldArchiveUrl'
    >
  >;

  beforeEach(async () => {
    serviceCatalog = jasmine.createSpyObj('ServiceCatalogService', [
      'listProfiles',
      'listArchetypes',
      'federationStatus',
      'builderStatus',
      'offer',
      'createDeployment',
      'createScaffold',
      'provisionDeployment',
      'federateDeployment',
      'scaffoldArchiveUrl',
    ]);
    serviceCatalog.listProfiles.and.resolveTo([]);
    serviceCatalog.listArchetypes.and.resolveTo(ARCHETYPES);
    // Honest defaults for this environment: federation + builder both ship dark.
    serviceCatalog.federationStatus.and.resolveTo({ enabled: false, warnings: ['ships dark'] });
    serviceCatalog.builderStatus.and.resolveTo({ enabled: false, buildNodePresent: false, warnings: [] });
    serviceCatalog.offer.and.resolveTo({
      id: 'cur-1', domain: 'acme.test', serviceKey: 'owncast', state: 'offered',
      curatedBySubject: 'google:root', createdAt: 'T', updatedAt: 'T',
    });
    serviceCatalog.createDeployment.and.resolveTo(deploymentRow());
    serviceCatalog.createScaffold.and.resolveTo(scaffoldRow());
    serviceCatalog.provisionDeployment.and.resolveTo(deploymentRow());
    serviceCatalog.federateDeployment.and.resolveTo(federateOutcome());
    serviceCatalog.scaffoldArchiveUrl.and.returnValue(
      '/bff/superadmin/service-store/acme.test/scaffold/sca-1/archive',
    );

    await TestBed.configureTestingModule({
      imports: [ServiceCatalogCreateServiceComponent],
      providers: [{ provide: ServiceCatalogService, useValue: serviceCatalog }],
    }).compileComponents();
    fixture = TestBed.createComponent(ServiceCatalogCreateServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await settle();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }
  async function settle(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  /** Fill a valid identity + a non-Java-package archetype + a live source + federation
   *  defaults, navigating through each step via next() so ensureFederationDefaults runs. */
  async function fillValidToReview(archetype = 'angular-mfe'): Promise<void> {
    component.domain.set('acme.test');
    component.serviceKey.set('owncast');
    component.next(); // identity → archetype
    component.selectArchetype(archetype);
    component.next(); // archetype → source
    component.sourceKind.set('SELECT');
    component.repoUrl.set('https://gitlab.acme.test/svc/owncast.git');
    component.next(); // source → federation
    component.next(); // federation → review
    await settle();
  }

  // ── step gating ─────────────────────────────────────────────────────────────

  it('blocks Next on the identity step until a domain + service key are present', () => {
    expect(component.currentStep()).toBe('identity');
    component.next();
    fixture.detectChanges();
    expect(component.currentStep()).withContext('stays on identity').toBe('identity');
    expect(el().querySelector('[data-testid="service-catalog-create-nav-error"]')).not.toBeNull();

    component.domain.set('acme.test');
    component.serviceKey.set('owncast');
    component.next();
    expect(component.currentStep()).toBe('archetype');
  });

  it('renders the archetype cards from the catalog and requires one before advancing', async () => {
    component.domain.set('acme.test');
    component.serviceKey.set('owncast');
    component.next();
    await settle();
    expect(el().querySelectorAll('[data-testid^="service-catalog-create-archetype-"]').length)
      .toBeGreaterThan(0);
    component.next();
    expect(component.currentStep()).withContext('no archetype chosen → blocked').toBe('archetype');
    component.selectArchetype('angular-mfe');
    component.next();
    expect(component.currentStep()).toBe('source');
  });

  // ── archetype slug validation (surfaced from the bff rule) ──────────────────

  it('rejects a hyphenated service key for the spring-bff (Java package) archetype BEFORE submit', async () => {
    component.domain.set('acme.test');
    component.serviceKey.set('own-cast'); // hyphen → slug "own-cast" not ^[a-z0-9]+$
    component.next();
    component.selectArchetype('spring-bff');
    await settle();
    expect(component.slugArchetypeInvalid()).toBeTrue();
    expect(el().querySelector('[data-testid="service-catalog-create-archetype-slug-error"]')).not.toBeNull();
    component.next();
    expect(component.currentStep()).withContext('blocked on the slug rule').toBe('archetype');
  });

  it('ACCEPTS a package-safe service key for spring-bff', async () => {
    component.domain.set('acme.test');
    component.serviceKey.set('owncast');
    component.next();
    component.selectArchetype('spring-bff');
    await settle();
    expect(component.slugArchetypeInvalid()).toBeFalse();
    component.next();
    expect(component.currentStep()).toBe('source');
  });

  // ── source pre-flight gating (shared with Add-a-service) ────────────────────

  it('offers all four sources with DOCKERFILE + ZIP disabled (builder ships dark)', async () => {
    component.domain.set('acme.test');
    component.serviceKey.set('owncast');
    component.next();
    component.selectArchetype('angular-mfe');
    component.next();
    await settle();
    const radios = Array.from(
      el().querySelectorAll('input[type="radio"][name="sourceKind"]'),
    ) as HTMLInputElement[];
    const byValue = new Map(radios.map((r) => [r.value, r]));
    expect([...byValue.keys()].sort()).toEqual(['DOCKERFILE', 'GIT', 'SELECT', 'ZIP']);
    expect(byValue.get('SELECT')!.disabled).toBeFalse();
    expect(byValue.get('DOCKERFILE')!.disabled).withContext('gated').toBeTrue();
    expect(byValue.get('ZIP')!.disabled).withContext('gated').toBeTrue();
  });

  it('a FAILED builder pre-flight fails SAFE (sources stay gated, never faked ready)', async () => {
    serviceCatalog.builderStatus.and.rejectWith(new Error('network'));
    // Rebuild the component so the failing pre-flight is the one that resolves.
    fixture = TestBed.createComponent(ServiceCatalogCreateServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await settle();
    expect(component.builderIsReady()).toBeFalse();
  });

  // ── federation ships-dark pre-flight ────────────────────────────────────────

  it('shows the federation ships-dark note when registration is not real', async () => {
    await fillValidToReview();
    component.stepIndex.set(3); // back to federation to inspect the note
    await settle();
    expect(el().querySelector('[data-testid="service-catalog-create-federation-dark"]')).not.toBeNull();
  });

  it('pre-fills the federation slug/mount/remote-entry defaults from the identity', async () => {
    component.domain.set('acme.test');
    component.serviceKey.set('owncast');
    component.next();
    component.selectArchetype('angular-mfe');
    component.next();
    component.sourceKind.set('SELECT');
    component.repoUrl.set('https://gitlab.acme.test/svc/owncast.git');
    component.next(); // → federation (ensureFederationDefaults)
    expect(component.slug()).toBe('owncast');
    expect(component.mountAt()).toBe('/owncast');
    expect(component.remoteEntryUrl()).toBe('http://hugmesh-owncast:8080/remoteEntry.json');
  });

  // ── the apply chain: exact sequential calls ─────────────────────────────────

  it('applies the chain in order with the exact derived bodies (offer→deployment→scaffold→provision→federate)', async () => {
    await fillValidToReview();
    await component.apply();
    await settle();

    expect(serviceCatalog.offer).toHaveBeenCalledWith('acme.test', 'owncast');
    expect(serviceCatalog.createDeployment).toHaveBeenCalledWith('acme.test', {
      serviceKey: 'owncast',
      profileRef: null,
    });
    expect(serviceCatalog.createScaffold).toHaveBeenCalledWith(
      'acme.test',
      { serviceKey: 'owncast', displayName: null, archetype: 'angular-mfe', mountAt: '/owncast', requiresRole: null },
      undefined,
    );
    expect(serviceCatalog.provisionDeployment).toHaveBeenCalledWith('acme.test', 'dep-1', {
      sourceKind: 'SELECT',
      repoUrl: 'https://gitlab.acme.test/svc/owncast.git',
      path: null,
      targetRevision: null,
    });
    expect(serviceCatalog.federateDeployment).toHaveBeenCalledWith(
      'acme.test',
      'dep-1',
      {
        slug: 'owncast',
        mountAt: '/owncast',
        exposedModule: './routes',
        remoteEntryUrl: 'http://hugmesh-owncast:8080/remoteEntry.json',
        kind: 'remote-shell',
        visibility: 'internal',
        requiresRole: null,
      },
      undefined,
    );
    expect(component.applyDone()).toBeTrue();
  });

  it('SKIPS the offer step when the offer toggle is off', async () => {
    await fillValidToReview();
    component.offerService.set(false);
    await component.apply();
    await settle();
    expect(serviceCatalog.offer).not.toHaveBeenCalled();
    expect(serviceCatalog.createDeployment).toHaveBeenCalled();
    const offerStep = el().querySelector('[data-testid="service-catalog-create-apply-offer-status"]')!;
    expect(offerStep.textContent).toContain('skipped');
  });

  it('SKIPS the federate step when federation is toggled off', async () => {
    await fillValidToReview();
    component.federate.set(false);
    await component.apply();
    await settle();
    expect(serviceCatalog.federateDeployment).not.toHaveBeenCalled();
    expect(serviceCatalog.provisionDeployment).toHaveBeenCalled();
  });

  it('shows the archive download link (direct GET href) after the scaffold step', async () => {
    await fillValidToReview();
    await component.apply();
    await settle();
    const link = el().querySelector('[data-testid="service-catalog-create-archive-link"]') as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('/bff/superadmin/service-store/acme.test/scaffold/sca-1/archive');
    expect(serviceCatalog.scaffoldArchiveUrl).toHaveBeenCalledWith('acme.test', 'sca-1');
  });

  // ── honesty: never fake success ─────────────────────────────────────────────

  it('renders the dark/pending note when federationReal=false and gitopsDescriptorPending=true', async () => {
    await fillValidToReview();
    await component.apply();
    await settle();
    const note = el().querySelector('[data-testid="service-catalog-create-dark-note"]')!;
    expect(note).not.toBeNull();
    expect(note.textContent).toContain('shipped dark');
    expect(note.textContent).toContain('descriptor stays pending');
  });

  it('does NOT render the dark note when federation is real and nothing pends', async () => {
    serviceCatalog.federateDeployment.and.resolveTo(
      federateOutcome({ federationReal: true, gitopsDescriptorPending: false }),
    );
    await fillValidToReview();
    await component.apply();
    await settle();
    expect(el().querySelector('[data-testid="service-catalog-create-dark-note"]')).toBeNull();
  });

  // ── step-up: pause + resume the SAME chain ──────────────────────────────────

  it('pauses on a scaffold step-up 403, then RESUMES carrying the token into scaffold + federate', async () => {
    let scaffoldCalls = 0;
    serviceCatalog.createScaffold.and.callFake(async (_d, _b, _token) => {
      scaffoldCalls += 1;
      if (scaffoldCalls === 1) {
        throw new ServiceCatalogApiError(
          403,
          'scaffolding a service requires step-up re-authentication (present X-ServiceStore-StepUp)',
        );
      }
      return scaffoldRow();
    });

    await fillValidToReview();
    await component.apply();
    await settle();

    // Paused: the challenge dialog is up, the deployment was already recorded, but no
    // provision/federate happened yet.
    expect(component.stepUpChallenge()).not.toBeNull();
    expect(el().querySelector('[data-testid="service-catalog-create-stepup"]')).not.toBeNull();
    expect(serviceCatalog.provisionDeployment).not.toHaveBeenCalled();
    expect(serviceCatalog.federateDeployment).not.toHaveBeenCalled();

    // Confirm a token → resume the SAME chain from scaffold.
    component.stepUpTokenInput.set('stepup-tok');
    await component.submitStepUp();
    await settle();

    expect(scaffoldCalls).toBe(2);
    expect(serviceCatalog.createScaffold.calls.argsFor(1)[2]).withContext('scaffold retry carries the token').toBe('stepup-tok');
    // The federate leg reuses the same confirmed token.
    expect(serviceCatalog.federateDeployment).toHaveBeenCalled();
    expect(serviceCatalog.federateDeployment.calls.mostRecent().args[3]).toBe('stepup-tok');
    expect(component.stepUpChallenge()).toBeNull();
    expect(component.applyDone()).toBeTrue();
  });

  it('cancelling the step-up marks the paused step errored and stops the chain', async () => {
    serviceCatalog.createScaffold.and.rejectWith(
      new ServiceCatalogApiError(
        403,
        'scaffolding a service requires step-up re-authentication (present X-ServiceStore-StepUp)',
      ),
    );
    await fillValidToReview();
    await component.apply();
    await settle();
    expect(component.stepUpChallenge()).not.toBeNull();

    component.cancelStepUp();
    await settle();
    expect(component.stepUpChallenge()).toBeNull();
    const scaffoldStep = el().querySelector('[data-testid="service-catalog-create-apply-scaffold"]')!;
    expect(scaffoldStep.getAttribute('data-status')).toBe('error');
    expect(serviceCatalog.federateDeployment).not.toHaveBeenCalled();
  });

  // ── error surfacing: bff 400 verbatim ───────────────────────────────────────

  it('surfaces a bff 400 VERBATIM on the failing apply step and stops the chain', async () => {
    serviceCatalog.createScaffold.and.rejectWith(
      new ServiceCatalogApiError(
        400,
        "serviceKey 'own cast' yields slug 'own-cast' which is not a valid Java package segment",
      ),
    );
    await fillValidToReview();
    await component.apply();
    await settle();
    const step = el().querySelector('[data-testid="service-catalog-create-apply-scaffold"]')!;
    expect(step.getAttribute('data-status')).toBe('error');
    expect(step.textContent).toContain('not a valid Java package segment');
    // The chain stopped before provision/federate.
    expect(serviceCatalog.provisionDeployment).not.toHaveBeenCalled();
  });

  // ── a11y ─────────────────────────────────────────────────────────────────────

  it('every interactive control on the review step has an accessible name (a11y)', async () => {
    await fillValidToReview();
    await component.apply();
    await settle();
    const controls = Array.from(
      el().querySelectorAll('input, button, select, a[href]'),
    ) as HTMLElement[];
    expect(controls.length).toBeGreaterThan(0);
    for (const c of controls) {
      expect(accessibleName(c)).withContext(c.outerHTML).toBeTruthy();
    }
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceCatalogOptionalServicesComponent } from './service-catalog-optional-services.component';
import { ServiceCatalogService, ServiceCatalogApiError } from './service-catalog.service';
import {
  OptionalServiceView,
  TOGGLEABLE_NOT_REPORTED,
  NO_REASON_GIVEN,
} from './optional-service-state';
import { accessibleName } from './accessible-name';

/**
 * The optional-services toggle screen. The suite is organised around the three
 * properties the screen exists to hold, each the inverse of a way it could lie:
 *
 *   1. NEVER show a service as enabled because the request was ACCEPTED.
 *   2. A slug the backend reports as NOT TOGGLEABLE is visibly, explainably unavailable.
 *   3. NEVER discard the server's reason on failure.
 */

/** A confirmed-ON, toggleable row; each test patches only the field it is about. */
function view(patch: Partial<OptionalServiceView> = {}): OptionalServiceView {
  return {
    slug: 'owncast',
    displayName: null,
    enabled: true,
    installed: true,
    phase: 'Enabled',
    generation: 2,
    observedGeneration: 2,
    applicationName: 'optional-owncast',
    lastReconcileTime: '2026-08-26T00:00:00Z',
    toggleable: true,
    toggleableReported: true,
    reason: null,
    message: null,
    ...patch,
  };
}

/** The measured character-forge shape: request accepted, status never written. */
function characterForge(): OptionalServiceView {
  return view({
    slug: 'character-forge',
    enabled: true,
    installed: null,
    phase: null,
    generation: null,
    observedGeneration: null,
    applicationName: null,
    lastReconcileTime: null,
  });
}

describe('ServiceCatalogOptionalServicesComponent (post-deploy service toggle)', () => {
  let fixture: ComponentFixture<ServiceCatalogOptionalServicesComponent>;
  let component: ServiceCatalogOptionalServicesComponent;
  let serviceCatalog: jasmine.SpyObj<
    Pick<ServiceCatalogService, 'listOptionalServices' | 'setOptionalServiceEnabled'>
  >;

  beforeEach(async () => {
    serviceCatalog = jasmine.createSpyObj('ServiceCatalogService', [
      'listOptionalServices',
      'setOptionalServiceEnabled',
    ]);
    serviceCatalog.listOptionalServices.and.resolveTo([]);
    serviceCatalog.setOptionalServiceEnabled.and.resolveTo(view());

    await TestBed.configureTestingModule({
      imports: [ServiceCatalogOptionalServicesComponent],
      providers: [{ provide: ServiceCatalogService, useValue: serviceCatalog }],
    }).compileComponents();
    fixture = TestBed.createComponent(ServiceCatalogOptionalServicesComponent);
    component = fixture.componentInstance;
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }
  function testid(id: string): HTMLElement | null {
    return el().querySelector(`[data-testid="${id}"]`);
  }
  /** Mount + let ngOnInit's load settle. */
  async function mount(rows?: OptionalServiceView[]): Promise<void> {
    if (rows) serviceCatalog.listOptionalServices.and.resolveTo(rows);
    fixture.detectChanges(); // triggers ngOnInit
    await fixture.whenStable();
    fixture.detectChanges();
  }
  async function click(id: string): Promise<void> {
    (testid(id) as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  // ── loading the list ─────────────────────────────────────────────────────

  it('loads GET /bff/superadmin/optional-services on mount', async () => {
    await mount([view()]);
    expect(serviceCatalog.listOptionalServices).toHaveBeenCalledTimes(1);
    expect(testid('service-catalog-optional-list')).not.toBeNull();
  });

  it('renders one row per service, in the order the server sent them', async () => {
    await mount([view({ slug: 'akkoma' }), view({ slug: 'tuwunel' }), view({ slug: 'phpbb' })]);
    const slugs = Array.from(el().querySelectorAll('[data-testid^="service-catalog-optional-row-"]')).map(
      (n) => n.getAttribute('data-testid'),
    );
    expect(slugs).toEqual([
      'service-catalog-optional-row-akkoma',
      'service-catalog-optional-row-tuwunel',
      'service-catalog-optional-row-phpbb',
    ]);
  });

  it('an EMPTY list is flagged as suspect, not rendered as a calm "nothing here"', async () => {
    await mount([]);
    const empty = testid('service-catalog-optional-empty');
    expect(empty).not.toBeNull();
    expect(empty!.className).toContain('warning');
  });

  // ── PROPERTY 1: only a CONFIRMED state reads as on ────────────────────────

  it('installed:true renders the confirmed-ON badge', async () => {
    await mount([view({ installed: true })]);
    expect(testid('service-catalog-optional-confirmed-owncast')!.textContent).toContain('On (confirmed)');
  });

  it('installed:false renders the confirmed-OFF badge', async () => {
    await mount([view({ enabled: false, installed: false })]);
    expect(testid('service-catalog-optional-confirmed-owncast')!.textContent).toContain('Off (confirmed)');
  });

  it('the character-forge shape (requested on, no status) does NOT read as on', async () => {
    await mount([characterForge()]);
    const badge = testid('service-catalog-optional-confirmed-character-forge')!;
    expect(badge.textContent).toContain('Not confirmed');
    expect(badge.textContent).not.toContain('On (confirmed)');
    // and the row says WHY, so the silent no-op is visible
    expect(testid('service-catalog-optional-unconfirmed-character-forge')).not.toBeNull();
  });

  it('a stale observedGeneration does NOT read as on even with installed:true', async () => {
    await mount([view({ generation: 5, observedGeneration: 4 })]);
    expect(testid('service-catalog-optional-confirmed-owncast')!.textContent).toContain('Not confirmed');
  });

  it('an ACCEPTED toggle does not turn the badge on — the notice speaks of a REQUEST', async () => {
    const pending = view({ slug: 'games', enabled: false, installed: false });
    await mount([pending]);
    // The PUT echoes spec.enabled:true; its status still describes the previous generation.
    const echoed = view({ slug: 'games', enabled: true, installed: false, generation: 3, observedGeneration: 2 });
    serviceCatalog.setOptionalServiceEnabled.and.resolveTo(echoed);
    serviceCatalog.listOptionalServices.and.resolveTo([echoed]);

    await click('service-catalog-optional-enable-games');

    expect(serviceCatalog.setOptionalServiceEnabled).toHaveBeenCalledWith('games', true, '');
    const badge = testid('service-catalog-optional-confirmed-games')!;
    expect(badge.textContent).withContext('a 2xx is not a confirmation').toContain('Not confirmed');
    expect(badge.textContent).not.toContain('On (confirmed)');
    const notice = testid('service-catalog-optional-notice')!;
    expect(notice.textContent).toContain('Requested');
    expect(notice.textContent).toContain('only once the controller');
  });

  it('stores the PUT echo VERBATIM — it never synthesises an installed from the request', async () => {
    // The mutation this closes: `applyRow({ ...updated, installed: target })`. Every other
    // test here is followed by the refresh, whose stubbed GET overwrites the row — so they
    // all stay green under that mutation. This one HOLDS the refresh open and inspects the
    // row the component actually wrote from the 2xx.
    const before = view({ slug: 'games', enabled: false, installed: false });
    await mount([before]);
    const echoed = view({
      slug: 'games',
      enabled: true,
      installed: null, // the controller has not written a status for the new generation
      phase: null,
      generation: 3,
      observedGeneration: 2,
    });
    serviceCatalog.setOptionalServiceEnabled.and.resolveTo(echoed);
    let releaseList: (rows: OptionalServiceView[]) => void = () => undefined;
    serviceCatalog.listOptionalServices.and.returnValue(
      new Promise<OptionalServiceView[]>((resolve) => {
        releaseList = resolve;
      }),
    );

    const inFlight = component.setEnabled(before, true);
    // Advance past the PUT and into the (parked) refresh, so the applied row is observable.
    for (let i = 0; i < 10; i++) await Promise.resolve();

    const applied = component.rows()!.find((r) => r.slug === 'games')!;
    expect(applied.enabled).withContext('the request is recorded').toBeTrue();
    expect(applied.installed)
      .withContext('a 2xx must not become a confirmation')
      .toBeNull();
    expect(component.confirmation(applied)).toBe('unconfirmed');

    releaseList([echoed]);
    await inFlight;
    fixture.detectChanges();
    expect(testid('service-catalog-optional-confirmed-games')!.textContent).toContain('Not confirmed');
  });

  it('a toggle whose echo has NO status at all still reads as unconfirmed', async () => {
    const cf = characterForge();
    await mount([view({ slug: 'character-forge', enabled: false, installed: false })]);
    serviceCatalog.setOptionalServiceEnabled.and.resolveTo(cf);
    serviceCatalog.listOptionalServices.and.resolveTo([cf]);
    await click('service-catalog-optional-enable-character-forge');
    expect(testid('service-catalog-optional-confirmed-character-forge')!.textContent).toContain(
      'Not confirmed',
    );
  });

  it('drift (requested on, confirmed off) is called out explicitly', async () => {
    await mount([view({ slug: 'tube', enabled: true, installed: false })]);
    const drift = testid('service-catalog-optional-drift-tube');
    expect(drift).not.toBeNull();
    expect(drift!.textContent).toContain('enabled');
    expect(drift!.textContent).toContain('off');
  });

  it('the whole rendered screen never says "On (confirmed)" for a row without a confirmation', async () => {
    await mount([characterForge(), view({ slug: 'games', installed: null, enabled: true })]);
    expect(el().textContent).not.toContain('On (confirmed)');
  });

  // ── PROPERTY 2: a NOT-TOGGLEABLE slug is visibly, explainably unavailable ──

  it('a not-toggleable slug disables BOTH actions and renders the server reason', async () => {
    const reason = 'meshbridge is absent from the CRD spec.slug enum; the API server rejects it.';
    await mount([view({ slug: 'meshbridge', toggleable: false, toggleableReported: true, reason })]);
    const enable = testid('service-catalog-optional-enable-meshbridge') as HTMLButtonElement;
    const disable = testid('service-catalog-optional-disable-meshbridge') as HTMLButtonElement;
    expect(enable.disabled).toBeTrue();
    expect(disable.disabled).toBeTrue();
    expect(testid('service-catalog-optional-blocked-meshbridge')!.textContent).toContain(reason);
  });

  it('the disabled action is programmatically described by the reason (a11y)', async () => {
    const reason = 'no registry entry';
    await mount([view({ slug: 'meshbridge', toggleable: false, reason })]);
    for (const which of ['enable', 'disable']) {
      const btn = testid(`service-catalog-optional-${which}-meshbridge`)!;
      const describedby = btn.getAttribute('aria-describedby');
      expect(describedby).withContext(which).toBeTruthy();
      const target = el().querySelector('#' + describedby);
      expect(target).withContext(which + ' describedby target exists').not.toBeNull();
      expect(target!.textContent).toContain(reason);
    }
  });

  it('a toggleable:false with NO reason still explains itself', async () => {
    await mount([view({ slug: 'coturn', toggleable: false, toggleableReported: true, reason: null })]);
    expect(testid('service-catalog-optional-blocked-coturn')!.textContent).toContain(NO_REASON_GIVEN);
  });

  it('an UNREPORTED toggleable fails safe: disabled, and says the server never said', async () => {
    await mount([view({ slug: 'anubis', toggleable: false, toggleableReported: false, reason: null })]);
    expect((testid('service-catalog-optional-enable-anubis') as HTMLButtonElement).disabled).toBeTrue();
    expect(testid('service-catalog-optional-blocked-anubis')!.textContent).toContain(
      TOGGLEABLE_NOT_REPORTED,
    );
  });

  it('a blocked row cannot be toggled programmatically either (defence-in-depth)', async () => {
    const row = view({ slug: 'meshbridge', toggleable: false, reason: 'no registry entry' });
    await mount([row]);
    await component.setEnabled(row, true);
    fixture.detectChanges();
    expect(serviceCatalog.setOptionalServiceEnabled).not.toHaveBeenCalled();
    expect(testid('service-catalog-optional-action-error')!.textContent).toContain('no registry entry');
  });

  it('EVERY disabled action on the screen has a rendered reason (no bare disabled control)', async () => {
    await mount([
      view({ slug: 'meshbridge', toggleable: false, reason: 'not in the enum' }),
      view({ slug: 'anubis', toggleable: false, toggleableReported: false }),
      view({ slug: 'owncast', enabled: true, installed: true }), // Enable is a confirmed no-op
      view({ slug: 'tube', enabled: false, installed: false }), // Disable is a confirmed no-op
    ]);
    const buttons = Array.from(
      el().querySelectorAll('[data-testid^="service-catalog-optional-enable-"], [data-testid^="service-catalog-optional-disable-"]'),
    ) as HTMLButtonElement[];
    const disabled = buttons.filter((b) => b.disabled);
    expect(disabled.length).withContext('the fixture must actually produce disabled buttons').toBe(6);
    for (const btn of disabled) {
      const describedby = btn.getAttribute('aria-describedby');
      expect(describedby).withContext(btn.getAttribute('data-testid')!).toBeTruthy();
      const target = el().querySelector('#' + describedby);
      expect(target).withContext(btn.getAttribute('data-testid')!).not.toBeNull();
      expect((target!.textContent ?? '').trim().length)
        .withContext(btn.getAttribute('data-testid')!)
        .toBeGreaterThan(0);
    }
  });

  // ── PROPERTY 3: the server's reason survives a failure ────────────────────

  it('a 400 renders the server message VERBATIM', async () => {
    await mount([view({ slug: 'games', enabled: false, installed: false })]);
    serviceCatalog.setOptionalServiceEnabled.and.rejectWith(
      new ServiceCatalogApiError(400, 'slug games is not in the CRD spec.slug enum'),
    );
    await click('service-catalog-optional-enable-games');
    expect(testid('service-catalog-optional-action-error')!.textContent).toContain(
      'slug games is not in the CRD spec.slug enum',
    );
  });

  it('a 403 keeps the server message ALONGSIDE the plain-language prefix', async () => {
    await mount([view({ slug: 'games', enabled: false, installed: false })]);
    serviceCatalog.setOptionalServiceEnabled.and.rejectWith(
      new ServiceCatalogApiError(403, 'step-up required for cluster-service changes'),
    );
    await click('service-catalog-optional-enable-games');
    const text = testid('service-catalog-optional-action-error')!.textContent!;
    expect(text).toContain('superadmin is required');
    expect(text).withContext('the prefix must not replace the server reason').toContain(
      'step-up required for cluster-service changes',
    );
  });

  it('a 404 and a 500 both surface their server text', async () => {
    await mount([view({ slug: 'games', enabled: false, installed: false })]);
    serviceCatalog.setOptionalServiceEnabled.and.rejectWith(
      new ServiceCatalogApiError(404, 'no OptionalService CR named games'),
    );
    await click('service-catalog-optional-enable-games');
    expect(testid('service-catalog-optional-action-error')!.textContent).toContain(
      'no OptionalService CR named games',
    );

    serviceCatalog.setOptionalServiceEnabled.and.rejectWith(
      new ServiceCatalogApiError(500, 'ApplicationSet patch rejected by the API server'),
    );
    await click('service-catalog-optional-enable-games');
    expect(testid('service-catalog-optional-action-error')!.textContent).toContain(
      'ApplicationSet patch rejected by the API server',
    );
  });

  it('says so explicitly when the server really did send nothing', async () => {
    await mount([view({ slug: 'games', enabled: false, installed: false })]);
    serviceCatalog.setOptionalServiceEnabled.and.rejectWith(new ServiceCatalogApiError(500, ''));
    await click('service-catalog-optional-enable-games');
    expect(testid('service-catalog-optional-action-error')!.textContent).toContain('failed');
  });

  it('a failed toggle leaves the row un-changed (a failure never flips the badge)', async () => {
    await mount([view({ slug: 'games', enabled: false, installed: false })]);
    serviceCatalog.setOptionalServiceEnabled.and.rejectWith(new ServiceCatalogApiError(400, 'nope'));
    await click('service-catalog-optional-enable-games');
    expect(testid('service-catalog-optional-confirmed-games')!.textContent).toContain('Off (confirmed)');
  });

  // ── the LOAD failure path (deliberately NOT a degrade-to-empty) ────────────

  it('a 404 on the load explains the missing endpoint — it does NOT show an empty list', async () => {
    serviceCatalog.listOptionalServices.and.rejectWith(
      new ServiceCatalogApiError(404, 'no handler for GET /bff/superadmin/optional-services'),
    );
    await mount();
    expect(testid('service-catalog-optional-empty')).withContext('never a calm empty state').toBeNull();
    const err = testid('service-catalog-optional-list-error')!;
    expect(err).not.toBeNull();
    expect(err.textContent).toContain('does not expose /bff/superadmin/optional-services');
    expect(err.textContent).toContain('no handler for GET /bff/superadmin/optional-services');
  });

  it('a 403 on the load explains the denial — it does NOT show an empty list', async () => {
    serviceCatalog.listOptionalServices.and.rejectWith(new ServiceCatalogApiError(403, 'forbidden'));
    await mount();
    expect(testid('service-catalog-optional-empty')).toBeNull();
    expect(testid('service-catalog-optional-list-error')!.textContent).toContain('superadmin is required');
  });

  it('a malformed payload (a plain Error from normalisation) surfaces its message', async () => {
    serviceCatalog.listOptionalServices.and.rejectWith(
      new Error('optional-services: expected a JSON array of services.'),
    );
    await mount();
    expect(testid('service-catalog-optional-list-error')!.textContent).toContain(
      'expected a JSON array of services',
    );
    expect(testid('service-catalog-optional-empty')).toBeNull();
  });

  it('Retry re-issues the load', async () => {
    serviceCatalog.listOptionalServices.and.rejectWith(new ServiceCatalogApiError(500, 'boom'));
    await mount();
    await click('service-catalog-optional-retry');
    expect(serviceCatalog.listOptionalServices).toHaveBeenCalledTimes(2);
  });

  // ── audit note + refresh ──────────────────────────────────────────────────

  it('sends the typed audit reason with the toggle', async () => {
    await mount([view({ slug: 'games', enabled: false, installed: false })]);
    component.note.set('  pilot brand  ');
    fixture.detectChanges();
    await click('service-catalog-optional-enable-games');
    expect(serviceCatalog.setOptionalServiceEnabled).toHaveBeenCalledWith(
      'games',
      true,
      '  pilot brand  ',
    );
  });

  it('Refresh reloads and clears the previous notice', async () => {
    await mount([view({ slug: 'games', enabled: false, installed: false })]);
    await click('service-catalog-optional-enable-games');
    expect(testid('service-catalog-optional-notice')).not.toBeNull();
    await click('service-catalog-optional-refresh');
    expect(testid('service-catalog-optional-notice')).toBeNull();
  });

  it('a refresh that fails after an accepted toggle keeps BOTH the notice and the failure', async () => {
    await mount([view({ slug: 'games', enabled: false, installed: false })]);
    serviceCatalog.setOptionalServiceEnabled.and.resolveTo(view({ slug: 'games', installed: null }));
    serviceCatalog.listOptionalServices.and.rejectWith(new ServiceCatalogApiError(500, 'boom'));
    await click('service-catalog-optional-enable-games');
    expect(testid('service-catalog-optional-notice')).not.toBeNull();
    expect(testid('service-catalog-optional-list-error')).not.toBeNull();
    // The list is withheld entirely — after a failed refresh the console does not know the
    // state, and says so rather than showing the pre-toggle rows as if they were current.
    expect(testid('service-catalog-optional-list')).toBeNull();
    expect(el().textContent).not.toContain('On (confirmed)');
  });

  // ── house rules ──────────────────────────────────────────────────────────

  it('opens NO modal — every message is inline state', async () => {
    await mount([view({ slug: 'meshbridge', toggleable: false, reason: 'nope' })]);
    await component.setEnabled(view({ slug: 'meshbridge', toggleable: false, reason: 'nope' }), true);
    fixture.detectChanges();
    expect(el().querySelector('dialog')).toBeNull();
    expect(el().querySelector('[role="dialog"]')).toBeNull();
    expect(el().querySelector('[role="alertdialog"]')).toBeNull();
  });

  it('every control has an accessible name (a11y)', async () => {
    await mount([
      view({ slug: 'owncast' }),
      view({ slug: 'meshbridge', toggleable: false, reason: 'nope' }),
    ]);
    const controls = Array.from(el().querySelectorAll('input, button')) as HTMLElement[];
    expect(controls.length).toBeGreaterThan(0);
    for (const c of controls) {
      expect(accessibleName(c)).withContext(c.outerHTML).toBeTruthy();
    }
  });
});

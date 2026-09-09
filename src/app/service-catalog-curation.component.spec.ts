import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceCatalogCurationComponent } from './service-catalog-curation.component';
import {
  ServiceCatalogService,
  ServiceCuration,
  ServiceCurationState,
  ServiceCatalogApiError,
} from './service-catalog.service';
import { accessibleName } from './accessible-name';

function cur(key: string, state: ServiceCurationState = 'offered'): ServiceCuration {
  return {
    id: 'c-' + key, domain: 'acme.test', serviceKey: key, state,
    curatedBySubject: 's', createdAt: 'T', updatedAt: 'T',
  };
}

describe('ServiceCatalogCurationComponent (per-domain offered catalog)', () => {
  let fixture: ComponentFixture<ServiceCatalogCurationComponent>;
  let component: ServiceCatalogCurationComponent;
  let serviceCatalog: jasmine.SpyObj<
    Pick<ServiceCatalogService, 'listCuration' | 'offer' | 'withdraw'>
  >;

  beforeEach(async () => {
    serviceCatalog = jasmine.createSpyObj('ServiceCatalogService', ['listCuration', 'offer', 'withdraw']);
    serviceCatalog.listCuration.and.resolveTo([]);
    serviceCatalog.offer.and.resolveTo(cur('owncast'));
    serviceCatalog.withdraw.and.resolveTo(cur('owncast', 'withdrawn'));

    await TestBed.configureTestingModule({
      imports: [ServiceCatalogCurationComponent],
      providers: [{ provide: ServiceCatalogService, useValue: serviceCatalog }],
    }).compileComponents();
    fixture = TestBed.createComponent(ServiceCatalogCurationComponent);
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

  it('loadDomain calls listCuration with the typed {domain} (the PATH segment)', async () => {
    serviceCatalog.listCuration.and.resolveTo([cur('owncast')]);
    await loadDomain('acme.test');
    expect(serviceCatalog.listCuration).toHaveBeenCalledWith('acme.test');
  });

  it('shows the EMPTY state when the domain has no offered services', async () => {
    serviceCatalog.listCuration.and.resolveTo([]);
    await loadDomain();
    expect(el().querySelector('[data-testid="service-catalog-curation-empty"]')).not.toBeNull();
  });

  it('lists only the OFFERED rows (withdrawn filtered out)', async () => {
    serviceCatalog.listCuration.and.resolveTo([cur('owncast', 'offered'), cur('forum', 'withdrawn')]);
    await loadDomain();
    const list = el().querySelector('[data-testid="service-catalog-curation-list"]')!;
    expect(list).not.toBeNull();
    expect(list.textContent).toContain('owncast');
    expect(list.textContent).not.toContain('forum');
  });

  it('offer posts the right {domain} + serviceKey', async () => {
    await loadDomain('acme.test');
    component.serviceKey.set('owncast');
    await component.offer();
    fixture.detectChanges();
    expect(serviceCatalog.offer).toHaveBeenCalledWith('acme.test', 'owncast');
    // and reloads the catalog after the write
    expect(serviceCatalog.listCuration).toHaveBeenCalledTimes(2);
    expect(el().querySelector('[data-testid="service-catalog-curation-notice"]')).not.toBeNull();
  });

  it('withdraw (from a row) posts the right {domain} + serviceKey', async () => {
    serviceCatalog.listCuration.and.resolveTo([cur('owncast')]);
    await loadDomain('acme.test');
    await component.withdraw('owncast');
    fixture.detectChanges();
    expect(serviceCatalog.withdraw).toHaveBeenCalledWith('acme.test', 'owncast');
  });

  it('does NOT offer when the service key is blank (form invalid)', async () => {
    await loadDomain('acme.test');
    component.serviceKey.set('   ');
    await component.offer();
    expect(serviceCatalog.offer).not.toHaveBeenCalled();
  });

  it('does NOT flag the service key as invalid merely from loading a domain', async () => {
    // Regression: loadDomain used to set the shared `touched` flag (needed for the
    // domain field), which prematurely rendered "A service key is required" on the
    // still-empty offer field on every catalog load. The offer form now tracks its
    // own keyTouched, so loading a domain must leave the key field un-flagged.
    await loadDomain('acme.test');
    expect(component.serviceKeyInvalid()).toBeFalse();
    const key = el().querySelector('#service-catalog-curation-key');
    expect(key?.getAttribute('aria-invalid')).toBeNull();
    expect(el().textContent).not.toContain('A service key is required');
  });

  it('DOES flag the service key required once an empty offer is submitted', async () => {
    await loadDomain('acme.test');
    component.serviceKey.set('');
    await component.offer();
    fixture.detectChanges();
    expect(component.serviceKeyInvalid()).toBeTrue();
    expect(el().textContent).toContain('A service key is required');
  });

  it('clears the service-key flag again after a SUCCESSFUL offer (field is reset)', async () => {
    await loadDomain('acme.test');
    component.serviceKey.set('owncast');
    await component.offer();
    fixture.detectChanges();
    // The field is cleared for the next offer; it must not be flagged invalid.
    expect(component.serviceKeyInvalid()).toBeFalse();
    expect(el().textContent).not.toContain('A service key is required');
  });

  it('surfaces a 403 from offer as a clear action error', async () => {
    await loadDomain('acme.test');
    component.serviceKey.set('owncast');
    serviceCatalog.offer.and.rejectWith(new ServiceCatalogApiError(403, 'forbidden'));
    await component.offer();
    fixture.detectChanges();
    const err = el().querySelector('[data-testid="service-catalog-curation-action-error"]')!;
    expect(err).not.toBeNull();
    expect(err.textContent).toContain('superadmin');
  });

  // ── step-up: pause + retry the SAME offer/withdraw ────────────────────────────

  it('a plain 403 (no step-up contract) NEVER raises the challenge — regression guard', async () => {
    await loadDomain('acme.test');
    component.serviceKey.set('owncast');
    serviceCatalog.offer.and.rejectWith(new ServiceCatalogApiError(403, 'forbidden'));
    await component.offer();
    fixture.detectChanges();
    expect(component.stepUpChallenge()).toBeNull();
    expect(el().querySelector('[data-testid="service-catalog-curation-stepup"]')).toBeNull();
  });

  it('pauses on an offer "requires step-up" 403 (challenge shown, NO error), then RETRIES with the token', async () => {
    await loadDomain('acme.test');
    component.serviceKey.set('owncast');
    serviceCatalog.offer.and.rejectWith(new ServiceCatalogApiError(
      403,
      'offering a service requires step-up re-authentication (present X-ServiceStore-StepUp)',
    ));
    await component.offer();
    fixture.detectChanges();
    expect(serviceCatalog.offer).toHaveBeenCalledTimes(1);
    expect(serviceCatalog.offer).toHaveBeenCalledWith('acme.test', 'owncast');
    expect(component.stepUpChallenge()?.action).toBe('Offering “owncast” to acme.test');
    expect(el().querySelector('[data-testid="service-catalog-curation-stepup"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="service-catalog-curation-action-error"]')).withContext('paused, not failed').toBeNull();
    expect(component.canAct()).withContext('actions held while the challenge is open').toBeFalse();

    serviceCatalog.offer.and.resolveTo(cur('owncast'));
    await component.submitStepUp('stepup-tok');
    fixture.detectChanges();
    expect(serviceCatalog.offer).toHaveBeenCalledTimes(2);
    expect(serviceCatalog.offer.calls.mostRecent().args).toEqual(['acme.test', 'owncast', 'stepup-tok']);
    expect(component.stepUpChallenge()).toBeNull();
    expect(el().querySelector('[data-testid="service-catalog-curation-notice"]')?.textContent).toContain('Offered “owncast”');
  });

  it('a per-row withdraw pauses on "requires step-up" and retries the SAME key with the token', async () => {
    serviceCatalog.listCuration.and.resolveTo([cur('owncast')]);
    await loadDomain('acme.test');
    serviceCatalog.withdraw.and.rejectWith(new ServiceCatalogApiError(
      403,
      'withdrawing a service requires step-up re-authentication (present X-ServiceStore-StepUp)',
    ));
    await component.withdraw('owncast');
    fixture.detectChanges();
    expect(component.stepUpChallenge()?.action).toBe('Withdrawing “owncast” from acme.test');
    const rowBtn = el().querySelector('[aria-label="Withdraw owncast from acme.test"]') as HTMLButtonElement;
    expect(rowBtn.disabled).withContext('row action held while the challenge is open').toBeTrue();

    serviceCatalog.withdraw.and.resolveTo(cur('owncast', 'withdrawn'));
    await component.submitStepUp('stepup-tok');
    expect(serviceCatalog.withdraw.calls.mostRecent().args).toEqual(['acme.test', 'owncast', 'stepup-tok']);
    expect(component.stepUpChallenge()).toBeNull();
  });

  it('cancelling the challenge reports the action as NOT performed and makes no second call', async () => {
    await loadDomain('acme.test');
    component.serviceKey.set('owncast');
    serviceCatalog.offer.and.rejectWith(new ServiceCatalogApiError(
      403,
      'offering a service requires step-up re-authentication (present X-ServiceStore-StepUp)',
    ));
    await component.offer();
    component.cancelStepUp();
    fixture.detectChanges();
    expect(serviceCatalog.offer).toHaveBeenCalledTimes(1);
    expect(component.stepUpChallenge()).toBeNull();
    const err = el().querySelector('[data-testid="service-catalog-curation-action-error"]')!;
    expect(err.textContent).toContain('was not offered');
    expect(component.canAct()).withContext('actions released after cancel').toBeTrue();
  });

  it('a wrong token re-raises the challenge (the bff is the authority) and drops the stale token', async () => {
    await loadDomain('acme.test');
    component.serviceKey.set('owncast');
    serviceCatalog.offer.and.rejectWith(new ServiceCatalogApiError(
      403,
      'offering a service requires step-up re-authentication (present X-ServiceStore-StepUp)',
    ));
    await component.offer();
    await component.submitStepUp('bad-tok');
    expect(serviceCatalog.offer.calls.mostRecent().args).toEqual(['acme.test', 'owncast', 'bad-tok']);
    expect(component.stepUpChallenge()).withContext('re-raised').not.toBeNull();
    expect(component.stepUpToken()).withContext('stale token dropped').toBe('');
  });

  it('the challenge controls have accessible names (a11y)', async () => {
    await loadDomain('acme.test');
    component.serviceKey.set('owncast');
    serviceCatalog.offer.and.rejectWith(new ServiceCatalogApiError(
      403,
      'offering a service requires step-up re-authentication (present X-ServiceStore-StepUp)',
    ));
    await component.offer();
    fixture.detectChanges();
    const box = el().querySelector('[data-testid="service-catalog-curation-stepup"]')!;
    const controls = Array.from(box.querySelectorAll('input, button')) as HTMLElement[];
    expect(controls.length).toBe(3);
    for (const c of controls) {
      expect(accessibleName(c)).withContext(c.outerHTML).toBeTruthy();
    }
  });

  it('degrades a 403 on the catalog LOAD to the empty state (graceful)', async () => {
    serviceCatalog.listCuration.and.rejectWith(new ServiceCatalogApiError(403, 'forbidden'));
    await loadDomain('acme.test');
    expect(el().querySelector('[data-testid="service-catalog-curation-empty"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="service-catalog-curation-error"]')).toBeNull();
  });

  it('shows the ERROR state on a non-auth load failure', async () => {
    serviceCatalog.listCuration.and.rejectWith(new ServiceCatalogApiError(500, 'boom'));
    await loadDomain('acme.test');
    expect(el().querySelector('[data-testid="service-catalog-curation-error"]')).not.toBeNull();
  });

  it('every form control + row action has an accessible name (a11y)', async () => {
    serviceCatalog.listCuration.and.resolveTo([cur('owncast')]);
    await loadDomain('acme.test');
    const controls = Array.from(
      el().querySelectorAll('input, button'),
    ) as HTMLElement[];
    for (const c of controls) {
      expect(accessibleName(c)).withContext(c.outerHTML).toBeTruthy();
    }
  });
});

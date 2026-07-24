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

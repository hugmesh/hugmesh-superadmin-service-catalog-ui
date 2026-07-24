import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceCatalogDeploymentsComponent } from './service-catalog-deployments.component';
import { ServiceCatalogService, ServiceDeployment, ServiceCatalogApiError } from './service-catalog.service';
import { accessibleName } from './accessible-name';

function dep(over: Partial<ServiceDeployment> = {}): ServiceDeployment {
  return {
    id: 'dep-1', domain: 'acme.test', serviceKey: 'owncast', profileRef: null,
    state: 'active', createdAt: '2026-01-01T00:00:00Z', endingAt: null,
    enforceActions: null, propagationState: 'pending', endedAt: null,
    createdBySubject: 's', ...over,
  };
}

describe('ServiceCatalogDeploymentsComponent (lifecycle accounting)', () => {
  let fixture: ComponentFixture<ServiceCatalogDeploymentsComponent>;
  let component: ServiceCatalogDeploymentsComponent;
  let serviceCatalog: jasmine.SpyObj<
    Pick<ServiceCatalogService, 'listDeployments' | 'createDeployment' | 'endDeployment' | 'listProfiles'>
  >;

  beforeEach(async () => {
    serviceCatalog = jasmine.createSpyObj('ServiceCatalogService', [
      'listDeployments', 'createDeployment', 'endDeployment', 'listProfiles',
    ]);
    serviceCatalog.listDeployments.and.resolveTo([]);
    serviceCatalog.listProfiles.and.resolveTo([]);
    serviceCatalog.createDeployment.and.resolveTo(dep());
    serviceCatalog.endDeployment.and.resolveTo(dep({ state: 'ended' }));

    await TestBed.configureTestingModule({
      imports: [ServiceCatalogDeploymentsComponent],
      providers: [{ provide: ServiceCatalogService, useValue: serviceCatalog }],
    }).compileComponents();
    fixture = TestBed.createComponent(ServiceCatalogDeploymentsComponent);
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

  it('always shows the accounting-only note (recording here does not itself provision)', () => {
    const note = el().querySelector('[data-testid="service-catalog-deployments-dark-note"]')!;
    expect(note).not.toBeNull();
    expect(note.textContent).toContain('does not itself provision');
  });

  it('loadDomain calls listDeployments with the typed {domain}', async () => {
    serviceCatalog.listDeployments.and.resolveTo([dep()]);
    await loadDomain('acme.test');
    expect(serviceCatalog.listDeployments).toHaveBeenCalledWith('acme.test');
  });

  it('shows the EMPTY state when no deployments exist for the domain', async () => {
    serviceCatalog.listDeployments.and.resolveTo([]);
    await loadDomain();
    expect(el().querySelector('[data-testid="service-catalog-deployments-empty"]')).not.toBeNull();
  });

  it('renders the accounting table with state / created / ending / enforce / propagation', async () => {
    serviceCatalog.listDeployments.and.resolveTo([
      dep({ serviceKey: 'owncast', endingAt: '2030-01-01T00:00:00Z', enforceActions: 'teardown,alert' }),
    ]);
    await loadDomain();
    const table = el().querySelector('[data-testid="service-catalog-deployments-list"]')!;
    expect(table).not.toBeNull();
    expect(table.textContent).toContain('owncast');
    expect(table.textContent).toContain('active');
    expect(table.textContent).toContain('teardown,alert');
    expect(table.textContent).toContain('pending');
  });

  it('record posts created/ending/enforce (serviceKey + endingAt as ISO + enforceActions)', async () => {
    await loadDomain('acme.test');
    component.serviceKey.set('owncast');
    component.profileRef.set('small-postgres');
    component.endingAtLocal.set('2030-01-01T00:00');
    component.enforceActions.set('teardown,alert');
    await component.record();
    fixture.detectChanges();

    expect(serviceCatalog.createDeployment).toHaveBeenCalled();
    const [domainArg, body] = serviceCatalog.createDeployment.calls.mostRecent().args;
    expect(domainArg).toBe('acme.test');
    expect(body.serviceKey).toBe('owncast');
    expect(body.profileRef).toBe('small-postgres');
    expect(body.enforceActions).toBe('teardown,alert');
    // endingAt is serialised to an ISO instant
    expect(typeof body.endingAt).toBe('string');
    expect(Number.isNaN(Date.parse(body.endingAt as string))).toBeFalse();
    // reloads after the write
    expect(serviceCatalog.listDeployments).toHaveBeenCalledTimes(2);
    expect(el().querySelector('[data-testid="service-catalog-deployments-notice"]')).not.toBeNull();
  });

  it('records a PERMANENT deployment with endingAt = null when the clock is blank', async () => {
    await loadDomain('acme.test');
    component.serviceKey.set('forum');
    component.endingAtLocal.set('');
    await component.record();
    const [, body] = serviceCatalog.createDeployment.calls.mostRecent().args;
    expect(body.endingAt).toBeNull();
  });

  it('does NOT record when the service key is blank', async () => {
    await loadDomain('acme.test');
    component.serviceKey.set('  ');
    await component.record();
    expect(serviceCatalog.createDeployment).not.toHaveBeenCalled();
  });

  it('does NOT flag the service key as invalid merely from loading a domain', async () => {
    // Regression: loadDomain used to set `touched` true, prematurely rendering
    // "A service key is required" under the record form on every load even though the
    // domain form has no touched-gated validation. Loading now resets touched.
    await loadDomain('acme.test');
    expect(component.serviceKeyInvalid()).toBeFalse();
    const key = el().querySelector('#service-catalog-record-key');
    expect(key?.getAttribute('aria-invalid')).toBeNull();
    expect(el().textContent).not.toContain('A service key is required');
  });

  it('DOES flag the service key required once an empty record is submitted', async () => {
    await loadDomain('acme.test');
    component.serviceKey.set('');
    await component.record();
    fixture.detectChanges();
    expect(component.serviceKeyInvalid()).toBeTrue();
    expect(el().textContent).toContain('A service key is required');
  });

  it('end calls endDeployment with the {domain} + row id', async () => {
    serviceCatalog.listDeployments.and.resolveTo([dep({ id: 'dep-9' })]);
    await loadDomain('acme.test');
    await component.end(dep({ id: 'dep-9' }));
    expect(serviceCatalog.endDeployment).toHaveBeenCalledWith('acme.test', 'dep-9');
  });

  it('surfaces a 403 on record clearly', async () => {
    await loadDomain('acme.test');
    component.serviceKey.set('owncast');
    serviceCatalog.createDeployment.and.rejectWith(new ServiceCatalogApiError(403, 'forbidden'));
    await component.record();
    fixture.detectChanges();
    const err = el().querySelector('[data-testid="service-catalog-deployments-form-error"]')!;
    expect(err.textContent).toContain('superadmin');
  });

  it('degrades a 403 on the LOAD to the empty state (graceful)', async () => {
    serviceCatalog.listDeployments.and.rejectWith(new ServiceCatalogApiError(403, 'forbidden'));
    await loadDomain('acme.test');
    expect(el().querySelector('[data-testid="service-catalog-deployments-empty"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="service-catalog-deployments-error"]')).toBeNull();
  });

  it('shows the ERROR state on a non-auth load failure', async () => {
    serviceCatalog.listDeployments.and.rejectWith(new ServiceCatalogApiError(500, 'boom'));
    await loadDomain('acme.test');
    expect(el().querySelector('[data-testid="service-catalog-deployments-error"]')).not.toBeNull();
  });

  it('every form control + row action has an accessible name (a11y)', async () => {
    serviceCatalog.listDeployments.and.resolveTo([dep()]);
    await loadDomain('acme.test');
    const controls = Array.from(el().querySelectorAll('input, select, button')) as HTMLElement[];
    for (const c of controls) {
      expect(accessibleName(c)).withContext(c.outerHTML).toBeTruthy();
    }
  });
});

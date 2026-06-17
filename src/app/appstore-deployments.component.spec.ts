import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppstoreDeploymentsComponent } from './appstore-deployments.component';
import { AppstoreService, ServiceDeployment, AppstoreApiError } from './appstore.service';
import { accessibleName } from './accessible-name';

function dep(over: Partial<ServiceDeployment> = {}): ServiceDeployment {
  return {
    id: 'dep-1', domain: 'acme.test', serviceKey: 'owncast', profileRef: null,
    state: 'active', createdAt: '2026-01-01T00:00:00Z', endingAt: null,
    enforceActions: null, propagationState: 'pending', endedAt: null,
    createdBySubject: 's', ...over,
  };
}

describe('AppstoreDeploymentsComponent (lifecycle accounting)', () => {
  let fixture: ComponentFixture<AppstoreDeploymentsComponent>;
  let component: AppstoreDeploymentsComponent;
  let appstore: jasmine.SpyObj<
    Pick<AppstoreService, 'listDeployments' | 'createDeployment' | 'endDeployment' | 'listProfiles'>
  >;

  beforeEach(async () => {
    appstore = jasmine.createSpyObj('AppstoreService', [
      'listDeployments', 'createDeployment', 'endDeployment', 'listProfiles',
    ]);
    appstore.listDeployments.and.resolveTo([]);
    appstore.listProfiles.and.resolveTo([]);
    appstore.createDeployment.and.resolveTo(dep());
    appstore.endDeployment.and.resolveTo(dep({ state: 'ended' }));

    await TestBed.configureTestingModule({
      imports: [AppstoreDeploymentsComponent],
      providers: [{ provide: AppstoreService, useValue: appstore }],
    }).compileComponents();
    fixture = TestBed.createComponent(AppstoreDeploymentsComponent);
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

  it('always shows the SHIPS-DARK note (the actual provision is a later increment)', () => {
    const note = el().querySelector('[data-testid="appstore-deployments-dark-note"]')!;
    expect(note).not.toBeNull();
    expect(note.textContent).toContain('later increment');
  });

  it('loadDomain calls listDeployments with the typed {domain}', async () => {
    appstore.listDeployments.and.resolveTo([dep()]);
    await loadDomain('acme.test');
    expect(appstore.listDeployments).toHaveBeenCalledWith('acme.test');
  });

  it('shows the EMPTY state when no deployments exist for the domain', async () => {
    appstore.listDeployments.and.resolveTo([]);
    await loadDomain();
    expect(el().querySelector('[data-testid="appstore-deployments-empty"]')).not.toBeNull();
  });

  it('renders the accounting table with state / created / ending / enforce / propagation', async () => {
    appstore.listDeployments.and.resolveTo([
      dep({ serviceKey: 'owncast', endingAt: '2030-01-01T00:00:00Z', enforceActions: 'teardown,alert' }),
    ]);
    await loadDomain();
    const table = el().querySelector('[data-testid="appstore-deployments-list"]')!;
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

    expect(appstore.createDeployment).toHaveBeenCalled();
    const [domainArg, body] = appstore.createDeployment.calls.mostRecent().args;
    expect(domainArg).toBe('acme.test');
    expect(body.serviceKey).toBe('owncast');
    expect(body.profileRef).toBe('small-postgres');
    expect(body.enforceActions).toBe('teardown,alert');
    // endingAt is serialised to an ISO instant
    expect(typeof body.endingAt).toBe('string');
    expect(Number.isNaN(Date.parse(body.endingAt as string))).toBeFalse();
    // reloads after the write
    expect(appstore.listDeployments).toHaveBeenCalledTimes(2);
    expect(el().querySelector('[data-testid="appstore-deployments-notice"]')).not.toBeNull();
  });

  it('records a PERMANENT deployment with endingAt = null when the clock is blank', async () => {
    await loadDomain('acme.test');
    component.serviceKey.set('forum');
    component.endingAtLocal.set('');
    await component.record();
    const [, body] = appstore.createDeployment.calls.mostRecent().args;
    expect(body.endingAt).toBeNull();
  });

  it('does NOT record when the service key is blank', async () => {
    await loadDomain('acme.test');
    component.serviceKey.set('  ');
    await component.record();
    expect(appstore.createDeployment).not.toHaveBeenCalled();
  });

  it('end calls endDeployment with the {domain} + row id', async () => {
    appstore.listDeployments.and.resolveTo([dep({ id: 'dep-9' })]);
    await loadDomain('acme.test');
    await component.end(dep({ id: 'dep-9' }));
    expect(appstore.endDeployment).toHaveBeenCalledWith('acme.test', 'dep-9');
  });

  it('surfaces a 403 on record clearly', async () => {
    await loadDomain('acme.test');
    component.serviceKey.set('owncast');
    appstore.createDeployment.and.rejectWith(new AppstoreApiError(403, 'forbidden'));
    await component.record();
    fixture.detectChanges();
    const err = el().querySelector('[data-testid="appstore-deployments-form-error"]')!;
    expect(err.textContent).toContain('superadmin');
  });

  it('degrades a 403 on the LOAD to the empty state (graceful)', async () => {
    appstore.listDeployments.and.rejectWith(new AppstoreApiError(403, 'forbidden'));
    await loadDomain('acme.test');
    expect(el().querySelector('[data-testid="appstore-deployments-empty"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="appstore-deployments-error"]')).toBeNull();
  });

  it('shows the ERROR state on a non-auth load failure', async () => {
    appstore.listDeployments.and.rejectWith(new AppstoreApiError(500, 'boom'));
    await loadDomain('acme.test');
    expect(el().querySelector('[data-testid="appstore-deployments-error"]')).not.toBeNull();
  });

  it('every form control + row action has an accessible name (a11y)', async () => {
    appstore.listDeployments.and.resolveTo([dep()]);
    await loadDomain('acme.test');
    const controls = Array.from(el().querySelectorAll('input, select, button')) as HTMLElement[];
    for (const c of controls) {
      expect(accessibleName(c)).withContext(c.outerHTML).toBeTruthy();
    }
  });
});

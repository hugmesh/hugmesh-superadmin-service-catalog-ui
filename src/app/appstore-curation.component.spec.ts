import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppstoreCurationComponent } from './appstore-curation.component';
import { AppstoreService, ServiceCuration, AppstoreApiError } from './appstore.service';
import { accessibleName } from './accessible-name';

function cur(key: string, state = 'offered'): ServiceCuration {
  return {
    id: 'c-' + key, domain: 'acme.test', serviceKey: key, state,
    curatedBySubject: 's', createdAt: 'T', updatedAt: 'T',
  };
}

describe('AppstoreCurationComponent (per-domain offered catalog)', () => {
  let fixture: ComponentFixture<AppstoreCurationComponent>;
  let component: AppstoreCurationComponent;
  let appstore: jasmine.SpyObj<
    Pick<AppstoreService, 'listCuration' | 'offer' | 'withdraw'>
  >;

  beforeEach(async () => {
    appstore = jasmine.createSpyObj('AppstoreService', ['listCuration', 'offer', 'withdraw']);
    appstore.listCuration.and.resolveTo([]);
    appstore.offer.and.resolveTo(cur('owncast'));
    appstore.withdraw.and.resolveTo(cur('owncast', 'withdrawn'));

    await TestBed.configureTestingModule({
      imports: [AppstoreCurationComponent],
      providers: [{ provide: AppstoreService, useValue: appstore }],
    }).compileComponents();
    fixture = TestBed.createComponent(AppstoreCurationComponent);
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
    appstore.listCuration.and.resolveTo([cur('owncast')]);
    await loadDomain('acme.test');
    expect(appstore.listCuration).toHaveBeenCalledWith('acme.test');
  });

  it('shows the EMPTY state when the domain has no offered services', async () => {
    appstore.listCuration.and.resolveTo([]);
    await loadDomain();
    expect(el().querySelector('[data-testid="appstore-curation-empty"]')).not.toBeNull();
  });

  it('lists only the OFFERED rows (withdrawn filtered out)', async () => {
    appstore.listCuration.and.resolveTo([cur('owncast', 'offered'), cur('forum', 'withdrawn')]);
    await loadDomain();
    const list = el().querySelector('[data-testid="appstore-curation-list"]')!;
    expect(list).not.toBeNull();
    expect(list.textContent).toContain('owncast');
    expect(list.textContent).not.toContain('forum');
  });

  it('offer posts the right {domain} + serviceKey', async () => {
    await loadDomain('acme.test');
    component.serviceKey.set('owncast');
    await component.offer();
    fixture.detectChanges();
    expect(appstore.offer).toHaveBeenCalledWith('acme.test', 'owncast');
    // and reloads the catalog after the write
    expect(appstore.listCuration).toHaveBeenCalledTimes(2);
    expect(el().querySelector('[data-testid="appstore-curation-notice"]')).not.toBeNull();
  });

  it('withdraw (from a row) posts the right {domain} + serviceKey', async () => {
    appstore.listCuration.and.resolveTo([cur('owncast')]);
    await loadDomain('acme.test');
    await component.withdraw('owncast');
    fixture.detectChanges();
    expect(appstore.withdraw).toHaveBeenCalledWith('acme.test', 'owncast');
  });

  it('does NOT offer when the service key is blank (form invalid)', async () => {
    await loadDomain('acme.test');
    component.serviceKey.set('   ');
    await component.offer();
    expect(appstore.offer).not.toHaveBeenCalled();
  });

  it('surfaces a 403 from offer as a clear action error', async () => {
    await loadDomain('acme.test');
    component.serviceKey.set('owncast');
    appstore.offer.and.rejectWith(new AppstoreApiError(403, 'forbidden'));
    await component.offer();
    fixture.detectChanges();
    const err = el().querySelector('[data-testid="appstore-curation-action-error"]')!;
    expect(err).not.toBeNull();
    expect(err.textContent).toContain('superadmin');
  });

  it('degrades a 403 on the catalog LOAD to the empty state (graceful)', async () => {
    appstore.listCuration.and.rejectWith(new AppstoreApiError(403, 'forbidden'));
    await loadDomain('acme.test');
    expect(el().querySelector('[data-testid="appstore-curation-empty"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="appstore-curation-error"]')).toBeNull();
  });

  it('shows the ERROR state on a non-auth load failure', async () => {
    appstore.listCuration.and.rejectWith(new AppstoreApiError(500, 'boom'));
    await loadDomain('acme.test');
    expect(el().querySelector('[data-testid="appstore-curation-error"]')).not.toBeNull();
  });

  it('every form control + row action has an accessible name (a11y)', async () => {
    appstore.listCuration.and.resolveTo([cur('owncast')]);
    await loadDomain('acme.test');
    const controls = Array.from(
      el().querySelectorAll('input, button'),
    ) as HTMLElement[];
    for (const c of controls) {
      expect(accessibleName(c)).withContext(c.outerHTML).toBeTruthy();
    }
  });
});

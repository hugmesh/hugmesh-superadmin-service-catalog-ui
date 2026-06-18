import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { ServiceCatalogForbiddenComponent } from './service-catalog-forbidden.component';
import { SessionService } from './session.service';
import { ServiceCatalogService, ServiceCuration, ServiceCatalogApiError } from './service-catalog.service';

const offered: ServiceCuration = {
  id: 'c1', domain: 'acme.test', serviceKey: 'owncast', state: 'offered',
  curatedBySubject: 's', createdAt: 'T', updatedAt: 'T',
};
const withdrawn: ServiceCuration = { ...offered, id: 'c2', serviceKey: 'forum', state: 'withdrawn' };

describe('ServiceCatalogForbiddenComponent', () => {
  const canReadOwnCatalog = signal(false);
  let serviceCatalog: jasmine.SpyObj<Pick<ServiceCatalogService, 'myDomainCatalog'>>;

  async function setup(): Promise<ComponentFixture<ServiceCatalogForbiddenComponent>> {
    await TestBed.configureTestingModule({
      imports: [ServiceCatalogForbiddenComponent],
      providers: [
        { provide: SessionService, useValue: { canReadOwnCatalog } },
        { provide: ServiceCatalogService, useValue: serviceCatalog },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ServiceCatalogForbiddenComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    serviceCatalog = jasmine.createSpyObj('ServiceCatalogService', ['myDomainCatalog']);
  });

  it('announces the denial in a role="alert" and explains the missing superadmin role', async () => {
    canReadOwnCatalog.set(false);
    TestBed.resetTestingModule();
    const fixture = await setup();
    const el = fixture.nativeElement as HTMLElement;
    const alert = el.querySelector('[role="alert"]')!;
    expect(alert).not.toBeNull();
    expect(alert.textContent).toContain('superadmin');
  });

  it('a non-admin does NOT attempt the two-tier catalog read', async () => {
    canReadOwnCatalog.set(false);
    TestBed.resetTestingModule();
    await setup();
    expect(serviceCatalog.myDomainCatalog).not.toHaveBeenCalled();
  });

  it('an ADMIN sees the read-only catalog of OFFERED rows (withdrawn filtered out)', async () => {
    canReadOwnCatalog.set(true);
    serviceCatalog.myDomainCatalog.and.resolveTo([offered, withdrawn]);
    TestBed.resetTestingModule();
    const fixture = await setup();
    const el = fixture.nativeElement as HTMLElement;
    expect(serviceCatalog.myDomainCatalog).toHaveBeenCalled();
    const list = el.querySelector('[data-testid="service-catalog-mycatalog-list"]')!;
    expect(list).not.toBeNull();
    expect(list.textContent).toContain('owncast');
    expect(list.textContent).not.toContain('forum');
  });

  it('shows the EMPTY state when no services are offered to the admin’s domain', async () => {
    canReadOwnCatalog.set(true);
    serviceCatalog.myDomainCatalog.and.resolveTo([]);
    TestBed.resetTestingModule();
    const fixture = await setup();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="service-catalog-mycatalog-empty"]')).not.toBeNull();
  });

  it('degrades a 403 on the two-tier read to an empty catalog (graceful)', async () => {
    canReadOwnCatalog.set(true);
    serviceCatalog.myDomainCatalog.and.rejectWith(new ServiceCatalogApiError(403, 'forbidden'));
    TestBed.resetTestingModule();
    const fixture = await setup();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="service-catalog-mycatalog-empty"]')).not.toBeNull();
    expect(el.querySelector('[data-testid="service-catalog-mycatalog-error"]')).toBeNull();
  });

  it('shows the ERROR state on a non-auth failure', async () => {
    canReadOwnCatalog.set(true);
    serviceCatalog.myDomainCatalog.and.rejectWith(new ServiceCatalogApiError(500, 'boom'));
    TestBed.resetTestingModule();
    const fixture = await setup();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="service-catalog-mycatalog-error"]')).not.toBeNull();
  });
});

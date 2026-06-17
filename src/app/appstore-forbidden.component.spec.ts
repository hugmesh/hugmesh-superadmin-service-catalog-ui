import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { AppstoreForbiddenComponent } from './appstore-forbidden.component';
import { SessionService } from './session.service';
import { AppstoreService, ServiceCuration, AppstoreApiError } from './appstore.service';

const offered: ServiceCuration = {
  id: 'c1', domain: 'acme.test', serviceKey: 'owncast', state: 'offered',
  curatedBySubject: 's', createdAt: 'T', updatedAt: 'T',
};
const withdrawn: ServiceCuration = { ...offered, id: 'c2', serviceKey: 'forum', state: 'withdrawn' };

describe('AppstoreForbiddenComponent', () => {
  const canReadOwnCatalog = signal(false);
  let appstore: jasmine.SpyObj<Pick<AppstoreService, 'myDomainCatalog'>>;

  async function setup(): Promise<ComponentFixture<AppstoreForbiddenComponent>> {
    await TestBed.configureTestingModule({
      imports: [AppstoreForbiddenComponent],
      providers: [
        { provide: SessionService, useValue: { canReadOwnCatalog } },
        { provide: AppstoreService, useValue: appstore },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AppstoreForbiddenComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    appstore = jasmine.createSpyObj('AppstoreService', ['myDomainCatalog']);
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
    expect(appstore.myDomainCatalog).not.toHaveBeenCalled();
  });

  it('an ADMIN sees the read-only catalog of OFFERED rows (withdrawn filtered out)', async () => {
    canReadOwnCatalog.set(true);
    appstore.myDomainCatalog.and.resolveTo([offered, withdrawn]);
    TestBed.resetTestingModule();
    const fixture = await setup();
    const el = fixture.nativeElement as HTMLElement;
    expect(appstore.myDomainCatalog).toHaveBeenCalled();
    const list = el.querySelector('[data-testid="appstore-mycatalog-list"]')!;
    expect(list).not.toBeNull();
    expect(list.textContent).toContain('owncast');
    expect(list.textContent).not.toContain('forum');
  });

  it('shows the EMPTY state when no services are offered to the admin’s domain', async () => {
    canReadOwnCatalog.set(true);
    appstore.myDomainCatalog.and.resolveTo([]);
    TestBed.resetTestingModule();
    const fixture = await setup();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="appstore-mycatalog-empty"]')).not.toBeNull();
  });

  it('degrades a 403 on the two-tier read to an empty catalog (graceful)', async () => {
    canReadOwnCatalog.set(true);
    appstore.myDomainCatalog.and.rejectWith(new AppstoreApiError(403, 'forbidden'));
    TestBed.resetTestingModule();
    const fixture = await setup();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="appstore-mycatalog-empty"]')).not.toBeNull();
    expect(el.querySelector('[data-testid="appstore-mycatalog-error"]')).toBeNull();
  });

  it('shows the ERROR state on a non-auth failure', async () => {
    canReadOwnCatalog.set(true);
    appstore.myDomainCatalog.and.rejectWith(new AppstoreApiError(500, 'boom'));
    TestBed.resetTestingModule();
    const fixture = await setup();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="appstore-mycatalog-error"]')).not.toBeNull();
  });
});

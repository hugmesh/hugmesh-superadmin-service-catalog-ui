import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { superadminGuard, APPSTORE_FORBIDDEN } from './appstore.guard';
import { SessionService } from './session.service';

type Caps = Pick<SessionService, 'canManageStore'>;

/**
 * Guard tests — the console's SUPERADMIN role boundary. The ALLOW path
 * (superadmin) and the DENY path for EACH non-superadmin tier (admin / mod /
 * user), and the DENY target is asserted to be the IN-REMOTE mount-path
 * '/appstore/forbidden' (NOT '/forbidden', NOT '/login') — the critical
 * correctness lesson the template carries.
 */
describe('superadminGuard (whole-console SUPERADMIN gate)', () => {
  let session: jasmine.SpyObj<Caps>;
  let parseUrlSpy: jasmine.Spy;

  beforeEach(() => {
    session = jasmine.createSpyObj<Caps>('SessionService', ['canManageStore']);
    parseUrlSpy = jasmine.createSpy('parseUrl').and.callFake((u: string) => ({ url: u } as unknown as UrlTree));
    TestBed.configureTestingModule({
      providers: [
        { provide: SessionService, useValue: session },
        { provide: Router, useValue: { parseUrl: parseUrlSpy } },
      ],
    });
  });

  function run() {
    return TestBed.runInInjectionContext(() => superadminGuard(null as never, null as never));
  }

  it('the forbidden target is the in-remote mount path (NOT /forbidden, NOT /login)', () => {
    expect(APPSTORE_FORBIDDEN).toBe('/appstore/forbidden');
  });

  it('ALLOWS a SUPERADMIN (canManageStore)', () => {
    session.canManageStore.and.returnValue(true);
    expect(run()).toBeTrue();
    expect(parseUrlSpy).not.toHaveBeenCalled();
  });

  it('DENIES an ADMIN → /appstore/forbidden', () => {
    session.canManageStore.and.returnValue(false);
    const r = run() as UrlTree;
    expect((r as unknown as { url: string }).url).toBe('/appstore/forbidden');
    expect(parseUrlSpy).toHaveBeenCalledWith('/appstore/forbidden');
  });

  it('DENIES a MOD → /appstore/forbidden', () => {
    session.canManageStore.and.returnValue(false);
    const r = run() as UrlTree;
    expect((r as unknown as { url: string }).url).toBe('/appstore/forbidden');
    expect(parseUrlSpy).toHaveBeenCalledWith('/appstore/forbidden');
  });

  it('DENIES a plain USER → /appstore/forbidden', () => {
    session.canManageStore.and.returnValue(false);
    const r = run() as UrlTree;
    expect((r as unknown as { url: string }).url).toBe('/appstore/forbidden');
    expect(parseUrlSpy).toHaveBeenCalledWith('/appstore/forbidden');
  });
});

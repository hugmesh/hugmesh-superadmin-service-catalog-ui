import { TestBed } from '@angular/core/testing';
import { SessionService, HugSession } from './session.service';

/** The role-composite signals are the UI's defence-in-depth gate, derived from
 *  the Casdoor roles in hug.session. Each tier (superadmin / admin / mod / plain
 *  user) is exercised against canManageStore (the whole-console SUPERADMIN gate)
 *  and canReadOwnCatalog (the two-tier ADMIN|SUPERADMIN read) — mirroring the
 *  admin-bff serviceCatalog role model. */
function sessionFor(roles: string[]): HugSession {
  return {
    id: 'google:x@y.com',
    label: 'x',
    provider: 'google',
    roles,
    registrationComplete: true,
  };
}

describe('SessionService (serviceCatalog role composites)', () => {
  let service: SessionService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [SessionService] });
    service = TestBed.inject(SessionService);
  });

  afterEach(() => localStorage.clear());

  function withRoles(roles: string[]): void {
    service.set(sessionFor(roles));
  }

  it('logged out → every composite is false', () => {
    expect(service.loggedIn()).toBeFalse();
    expect(service.canManageStore()).toBeFalse();
    expect(service.canReadOwnCatalog()).toBeFalse();
  });

  it('a plain USER can do NONE of the Service Catalog views', () => {
    withRoles(['user']);
    expect(service.canManageStore()).withContext('console is superadmin-only').toBeFalse();
    expect(service.canReadOwnCatalog()).withContext('read floor is admin|superadmin').toBeFalse();
  });

  it('a MOD can do NONE of the Service Catalog views', () => {
    withRoles(['user', 'mod']);
    expect(service.isMod()).toBeTrue();
    expect(service.canManageStore()).toBeFalse();
    expect(service.canReadOwnCatalog()).withContext('a mod is not an admin').toBeFalse();
  });

  it('an ADMIN canReadOwnCatalog (two-tier read) but NOT canManageStore (the write console)', () => {
    withRoles(['user', 'admin']);
    expect(service.canReadOwnCatalog()).toBeTrue();
    expect(service.canManageStore()).withContext('the whole console is superadmin-only').toBeFalse();
  });

  it('a SUPERADMIN canManageStore + canReadOwnCatalog (the full infra control plane)', () => {
    withRoles(['superadmin']);
    expect(service.canManageStore()).toBeTrue();
    expect(service.canReadOwnCatalog()).toBeTrue();
    expect(service.isSuperadmin()).toBeTrue();
  });

  it('a SUPERADMIN is NOT counted as a raw admin (the cascade is explicit)', () => {
    withRoles(['superadmin']);
    expect(service.isAdmin()).withContext('superadmin != admin in the raw role set').toBeFalse();
    expect(service.canManageStore()).toBeTrue();
  });
});

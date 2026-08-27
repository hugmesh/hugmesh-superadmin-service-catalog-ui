import { SERVICE_CATALOG_ROUTES } from './service-catalog.routes';
import { superadminGuard } from './service-catalog.guard';


// ── every child route is superadmin-gated, DERIVED not listed ────────────────
// FOUND BY AN ADVERSARIAL VERIFIER, not by this suite: deleting
// `canActivate: [superadminGuard]` from the optional-services route alone left the
// whole suite GREEN (228/228) and the built-artefact route check green too, because
// that check greps `path:"x",component:` and says nothing about guards. The guard
// FUNCTION has its own specs; its ATTACHMENT to this route had none, and an
// unguarded superadmin route is a real hole, not a style question.
//
// Derived over the children rather than asserted per-path: a list would need editing
// every time a route lands, which is exactly how the next one arrives unguarded.
describe('service-catalog child routes are all superadmin-gated', () => {
  const children = (SERVICE_CATALOG_ROUTES[0]?.children ?? []).filter(
    (r) => r.component && r.path !== 'forbidden',
  );

  it('derives a non-empty set of guarded child routes (an empty scan proves nothing)', () => {
    expect(children.length).toBeGreaterThan(3);
  });

  children.forEach((r) => {
    it(`'${r.path}' carries superadminGuard`, () => {
      expect(r.canActivate ?? [])
        .withContext(`route '${r.path}' is reachable without a superadmin check`)
        .toContain(superadminGuard);
    });
  });
});

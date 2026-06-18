import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from './session.service';

/**
 * Route guard for the Superadmin Service Catalog console — the UI half of the Service Catalog
 * role model. It mirrors the snapdragon-admin-bff-api gates (defence-in-depth; the
 * bff is authoritative):
 *
 *   superadminGuard — SUPERADMIN. Gates the WHOLE console (curation write,
 *                     app-profile CRUD, deployment list/create/end). Every
 *                     /bff/superadmin/service-store + /bff/superadmin/app-profiles
 *                     endpoint is @PreAuthorize("hasRole('SUPERADMIN')") AND walled
 *                     at the coarse /bff/superadmin/** = hasRole('SUPERADMIN') gate,
 *                     so an admin/mod/user is DENIED here too.
 *
 * A denied activation routes to the IN-REMOTE mount-path forbidden screen —
 * router.parseUrl('/service-catalog/forbidden') — NOT '/forbidden' and NOT '/login'.
 * The host already authgated the user in (route-access /service-catalog=superadmin), so a
 * denial here is a WITHIN-SERVICE privilege boundary, not an auth failure.
 * (Shipping the bare '/forbidden' was a real wiki-ui bug — the mount-prefixed path
 * is the correct in-remote target.) The forbidden screen explains the missing role
 * + offers a route back. An ADMIN still gets a graceful read-only "my domain's
 * offered catalog" landing on that screen (the two-tier /bff/admin/service-store
 * degrade), since an admin can read but cannot manage the store.
 */

/** The in-remote forbidden screen, at the host mount path /service-catalog. A DENY MUST
 *  route here (NOT '/forbidden', NOT '/login'). */
export const SERVICE_CATALOG_FORBIDDEN = '/service-catalog/forbidden';

export const superadminGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);
  return session.canManageStore() ? true : router.parseUrl(SERVICE_CATALOG_FORBIDDEN);
};

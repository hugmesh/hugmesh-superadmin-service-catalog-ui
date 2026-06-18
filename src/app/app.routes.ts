import { Routes } from '@angular/router';
import { SERVICE_CATALOG_ROUTES } from './service-catalog.routes';

/** Dev-shell routes: mount the exposed ServiceCatalog routes under /service-catalog so the
 *  remote is browsable standalone (`ng serve service-catalog`) AT THE SAME mount path
 *  the host uses — so the in-remote guard redirect to /service-catalog/forbidden
 *  resolves identically in the dev shell and under the host. The host ignores
 *  this file and loads the exposed `./ServiceCatalog` module (SERVICE_CATALOG_ROUTES) directly
 *  at /service-catalog. */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'service-catalog' },
  { path: 'service-catalog', children: SERVICE_CATALOG_ROUTES },
];

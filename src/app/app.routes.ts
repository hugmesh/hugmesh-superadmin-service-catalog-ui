import { Routes } from '@angular/router';
import { APPSTORE_ROUTES } from './appstore.routes';

/** Dev-shell routes: mount the exposed Appstore routes under /appstore so the
 *  remote is browsable standalone (`ng serve appstore`) AT THE SAME mount path
 *  the host uses — so the in-remote guard redirect to /appstore/forbidden
 *  resolves identically in the dev shell and under the host. The host ignores
 *  this file and loads the exposed `./Appstore` module (APPSTORE_ROUTES) directly
 *  at /appstore. */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'appstore' },
  { path: 'appstore', children: APPSTORE_ROUTES },
];

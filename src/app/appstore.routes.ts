import { Routes } from '@angular/router';
import { AppstoreConsoleComponent } from './appstore-console.component';
import { AppstoreCurationComponent } from './appstore-curation.component';
import { AppstoreProfilesComponent } from './appstore-profiles.component';
import { AppstoreDeploymentsComponent } from './appstore-deployments.component';
import { AppstoreAddServiceComponent } from './appstore-add-service.component';
import { AppstoreForbiddenComponent } from './appstore-forbidden.component';
import { superadminGuard } from './appstore.guard';

/**
 * The exposed `./Appstore` module — mounted by the snapdragon.systems host at the
 * apex path /appstore (the federation-api appstore module row: mountAt '/appstore',
 * remote_entry_url http://snapdragon-superadmin-appstore-ui:8080/remoteEntry.json,
 * requiresRole 'superadmin', visibility internal). The host gates the WHOLE
 * /appstore mount behind route-access superadmin; THESE child guards enforce the
 * same SUPERADMIN boundary in-remote (defence-in-depth) so a non-superadmin who
 * reaches the bundle still lands on the forbidden screen.
 *
 * View → role gate (mirrors snapdragon-admin-bff-api appstore controllers):
 *   ''            AppstoreConsole      — shell + nav (gated to SUPERADMIN by the children)
 *   add           AppstoreAddService   — provision a deployment via one of the 4 sources (superadminGuard)
 *   curation      AppstoreCuration     — per-domain offered catalog (superadminGuard)
 *   profiles      AppstoreProfiles     — app_profile deploy-template CRUD (superadminGuard)
 *   deployments   AppstoreDeployments  — service_deployment accounting (superadminGuard)
 *   forbidden     AppstoreForbidden    — the within-service privilege-boundary screen
 *
 * The guard `false`-paths route to /appstore/forbidden (the IN-REMOTE mount-path
 * screen — NOT '/forbidden', NOT '/login'): the host already authgated the user
 * in; a denial here is a within-appstore privilege boundary.
 */
export const APPSTORE_ROUTES: Routes = [
  {
    path: '',
    component: AppstoreConsoleComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'add' },
      { path: 'add', component: AppstoreAddServiceComponent, canActivate: [superadminGuard] },
      { path: 'curation', component: AppstoreCurationComponent, canActivate: [superadminGuard] },
      { path: 'profiles', component: AppstoreProfilesComponent, canActivate: [superadminGuard] },
      { path: 'deployments', component: AppstoreDeploymentsComponent, canActivate: [superadminGuard] },
      { path: 'forbidden', component: AppstoreForbiddenComponent },
    ],
  },
];

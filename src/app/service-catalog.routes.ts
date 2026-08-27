import { Routes } from '@angular/router';
import { ServiceCatalogConsoleComponent } from './service-catalog-console.component';
import { ServiceCatalogCurationComponent } from './service-catalog-curation.component';
import { ServiceCatalogProfilesComponent } from './service-catalog-profiles.component';
import { ServiceCatalogDeploymentsComponent } from './service-catalog-deployments.component';
import { ServiceCatalogOptionalServicesComponent } from './service-catalog-optional-services.component';
import { ServiceCatalogAddServiceComponent } from './service-catalog-add-service.component';
import { ServiceCatalogCreateServiceComponent } from './service-catalog-create-service.component';
import { ServiceCatalogForbiddenComponent } from './service-catalog-forbidden.component';
import { superadminGuard } from './service-catalog.guard';

/**
 * The exposed `./ServiceCatalog` module — mounted by the hugmesh.net host at the
 * apex path /service-catalog (the federation-api serviceCatalog module row: mountAt '/service-catalog',
 * remote_entry_url http://hugmesh-superadmin-service-catalog-ui:8080/remoteEntry.json,
 * requiresRole 'superadmin', visibility internal). The host gates the WHOLE
 * /service-catalog mount behind route-access superadmin; THESE child guards enforce the
 * same SUPERADMIN boundary in-remote (defence-in-depth) so a non-superadmin who
 * reaches the bundle still lands on the forbidden screen.
 *
 * View → role gate (mirrors hugmesh-admin-bff-api serviceCatalog controllers):
 *   ''            ServiceCatalogConsole        — shell + nav (gated to SUPERADMIN by the children)
 *   add           ServiceCatalogAddService     — provision a deployment via one of the 4 sources (superadminGuard)
 *   create        ServiceCatalogCreateService  — create-and-federate a brand-new service (scaffold wizard, superadminGuard)
 *   curation      ServiceCatalogCuration       — per-domain offered catalog (superadminGuard)
 *   profiles      ServiceCatalogProfiles     — app_profile deploy-template CRUD (superadminGuard)
 *   deployments   ServiceCatalogDeployments  — service_deployment accounting (superadminGuard)
 *   optional-services ServiceCatalogOptionalServices — post-deploy on/off for the optional
 *                 cluster services (superadminGuard). The second half of "an image ships with
 *                 only its selected services UNTIL a superadmin enables others".
 *   forbidden     ServiceCatalogForbidden    — the within-service privilege-boundary screen
 *
 * The guard `false`-paths route to /service-catalog/forbidden (the IN-REMOTE mount-path
 * screen — NOT '/forbidden', NOT '/login'): the host already authgated the user
 * in; a denial here is a within-service-catalog privilege boundary.
 */
export const SERVICE_CATALOG_ROUTES: Routes = [
  {
    path: '',
    component: ServiceCatalogConsoleComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'add' },
      { path: 'add', component: ServiceCatalogAddServiceComponent, canActivate: [superadminGuard] },
      { path: 'create', component: ServiceCatalogCreateServiceComponent, canActivate: [superadminGuard] },
      { path: 'curation', component: ServiceCatalogCurationComponent, canActivate: [superadminGuard] },
      { path: 'profiles', component: ServiceCatalogProfilesComponent, canActivate: [superadminGuard] },
      { path: 'deployments', component: ServiceCatalogDeploymentsComponent, canActivate: [superadminGuard] },
      {
        path: 'optional-services',
        component: ServiceCatalogOptionalServicesComponent,
        canActivate: [superadminGuard],
      },
      { path: 'forbidden', component: ServiceCatalogForbiddenComponent },
    ],
  },
];

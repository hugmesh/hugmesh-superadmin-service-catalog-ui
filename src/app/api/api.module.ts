/* tslint:disable */
/* eslint-disable */
import { NgModule, ModuleWithProviders, SkipSelf, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfiguration, ApiConfigurationParams } from './api-configuration';

import { WorkloadSuperadminControllerService } from './services/workload-superadmin-controller.service';
import { GamesCatalogSuperadminControllerService } from './services/games-catalog-superadmin-controller.service';
import { AppProfileControllerService } from './services/app-profile-controller.service';
import { OidcProviderRolesControllerService } from './services/oidc-provider-roles-controller.service';
import { DomainRegistryControllerService } from './services/domain-registry-controller.service';
import { BackupAdminControllerService } from './services/backup-admin-controller.service';
import { AnnouncementAdminControllerService } from './services/announcement-admin-controller.service';
import { AnnouncementSuppressionControllerService } from './services/announcement-suppression-controller.service';
import { ServiceCurationControllerService } from './services/service-curation-controller.service';
import { ServiceDeploymentControllerService } from './services/service-deployment-controller.service';
import { DesktopDialAdminControllerService } from './services/desktop-dial-admin-controller.service';
import { BackupSuperadminControllerService } from './services/backup-superadmin-controller.service';
import { AuthControllerService } from './services/auth-controller.service';
import { MfaEnrollmentControllerService } from './services/mfa-enrollment-controller.service';
import { MfaChallengeControllerService } from './services/mfa-challenge-controller.service';
import { ImageBuildIngestControllerService } from './services/image-build-ingest-controller.service';
import { DeviceEnrollmentControllerService } from './services/device-enrollment-controller.service';
import { GameInstanceControllerService } from './services/game-instance-controller.service';
import { DesktopInstallRequestUserControllerService } from './services/desktop-install-request-user-controller.service';
import { TestReportsControllerService } from './services/test-reports-controller.service';
import { SystemAccountControllerService } from './services/system-account-controller.service';
import { AdminSshKeyIssuanceControllerService } from './services/admin-ssh-key-issuance-controller.service';
import { AdminControllerService } from './services/admin-controller.service';
import { BackupControllerService } from './services/backup-controller.service';
import { NotificationsFeatureInfraTriggersService } from './services/notifications-feature-infra-triggers.service';
import { ImageBuildControllerService } from './services/image-build-controller.service';
import { ForumAdminControllerService } from './services/forum-admin-controller.service';
import { EgressVpnControllerService } from './services/egress-vpn-controller.service';
import { StoragePoolControllerService } from './services/storage-pool-controller.service';
import { DeviceLicenseControllerService } from './services/device-license-controller.service';
import { DesktopSudoAdminControllerService } from './services/desktop-sudo-admin-controller.service';
import { DesktopStepUpControllerService } from './services/desktop-step-up-controller.service';
import { DesktopSshTerminalControllerService } from './services/desktop-ssh-terminal-controller.service';
import { DesktopRemoteInstallControllerService } from './services/desktop-remote-install-controller.service';
import { DesktopInstallRequestAdminControllerService } from './services/desktop-install-request-admin-controller.service';
import { DesktopCatalogAdminControllerService } from './services/desktop-catalog-admin-controller.service';
import { AppealContactControllerService } from './services/appeal-contact-controller.service';
import { AnnouncementSurfaceControllerService } from './services/announcement-surface-controller.service';
import { DesktopSudoEntitlementControllerService } from './services/desktop-sudo-entitlement-controller.service';
import { DesktopRegistryControllerService } from './services/desktop-registry-controller.service';
import { WorkloadAdminControllerService } from './services/workload-admin-controller.service';
import { AdminServiceStoreControllerService } from './services/admin-service-store-controller.service';
import { PlatformCapabilitiesControllerService } from './services/platform-capabilities-controller.service';
import { AnubisControllerService } from './services/anubis-controller.service';

/**
 * Module that provides all services and configuration.
 */
@NgModule({
  imports: [],
  exports: [],
  declarations: [],
  providers: [
    WorkloadSuperadminControllerService,
    GamesCatalogSuperadminControllerService,
    AppProfileControllerService,
    OidcProviderRolesControllerService,
    DomainRegistryControllerService,
    BackupAdminControllerService,
    AnnouncementAdminControllerService,
    AnnouncementSuppressionControllerService,
    ServiceCurationControllerService,
    ServiceDeploymentControllerService,
    DesktopDialAdminControllerService,
    BackupSuperadminControllerService,
    AuthControllerService,
    MfaEnrollmentControllerService,
    MfaChallengeControllerService,
    ImageBuildIngestControllerService,
    DeviceEnrollmentControllerService,
    GameInstanceControllerService,
    DesktopInstallRequestUserControllerService,
    TestReportsControllerService,
    SystemAccountControllerService,
    AdminSshKeyIssuanceControllerService,
    AdminControllerService,
    BackupControllerService,
    NotificationsFeatureInfraTriggersService,
    ImageBuildControllerService,
    ForumAdminControllerService,
    EgressVpnControllerService,
    StoragePoolControllerService,
    DeviceLicenseControllerService,
    DesktopSudoAdminControllerService,
    DesktopStepUpControllerService,
    DesktopSshTerminalControllerService,
    DesktopRemoteInstallControllerService,
    DesktopInstallRequestAdminControllerService,
    DesktopCatalogAdminControllerService,
    AppealContactControllerService,
    AnnouncementSurfaceControllerService,
    DesktopSudoEntitlementControllerService,
    DesktopRegistryControllerService,
    WorkloadAdminControllerService,
    AdminServiceStoreControllerService,
    PlatformCapabilitiesControllerService,
    AnubisControllerService,
    ApiConfiguration
  ],
})
export class ApiModule {
  static forRoot(params: ApiConfigurationParams): ModuleWithProviders<ApiModule> {
    return {
      ngModule: ApiModule,
      providers: [
        {
          provide: ApiConfiguration,
          useValue: params
        }
      ]
    }
  }

  constructor( 
    @Optional() @SkipSelf() parentModule: ApiModule,
    @Optional() http: HttpClient
  ) {
    if (parentModule) {
      throw new Error('ApiModule is already loaded. Import in your base AppModule only.');
    }
    if (!http) {
      throw new Error('You need to import the HttpClientModule in your AppModule! \n' +
      'See also https://github.com/angular/angular/issues/20575');
    }
  }
}

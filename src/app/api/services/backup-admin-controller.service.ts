/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { backupAdminArtifacts } from '../fn/backup-admin-controller/backup-admin-artifacts';
import { BackupAdminArtifacts$Params } from '../fn/backup-admin-controller/backup-admin-artifacts';
import { backupAdminCreate } from '../fn/backup-admin-controller/backup-admin-create';
import { BackupAdminCreate$Params } from '../fn/backup-admin-controller/backup-admin-create';
import { backupAdminGetDestination } from '../fn/backup-admin-controller/backup-admin-get-destination';
import { BackupAdminGetDestination$Params } from '../fn/backup-admin-controller/backup-admin-get-destination';
import { backupAdminList } from '../fn/backup-admin-controller/backup-admin-list';
import { BackupAdminList$Params } from '../fn/backup-admin-controller/backup-admin-list';
import { backupAdminPutDestination } from '../fn/backup-admin-controller/backup-admin-put-destination';
import { BackupAdminPutDestination$Params } from '../fn/backup-admin-controller/backup-admin-put-destination';
import { backupAdminRestore } from '../fn/backup-admin-controller/backup-admin-restore';
import { BackupAdminRestore$Params } from '../fn/backup-admin-controller/backup-admin-restore';
import { backupAdminServices } from '../fn/backup-admin-controller/backup-admin-services';
import { BackupAdminServices$Params } from '../fn/backup-admin-controller/backup-admin-services';
import { backupAdminVersions } from '../fn/backup-admin-controller/backup-admin-versions';
import { BackupAdminVersions$Params } from '../fn/backup-admin-controller/backup-admin-versions';
import { BackupArtifact } from '../models/backup-artifact';
import { BackupDestination } from '../models/backup-destination';
import { BackupSet } from '../models/backup-set';
import { RunningService } from '../models/running-service';

@Injectable({ providedIn: 'root' })
export class BackupAdminControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `backupAdminGetDestination()` */
  static readonly BackupAdminGetDestinationPath = '/bff/admin/cloud-backups/destinations';

  /**
   * Get destination.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `backupAdminGetDestination()` instead.
   *
   * This method doesn't expect any request body.
   */
  backupAdminGetDestination$Response(params?: BackupAdminGetDestination$Params, context?: HttpContext): Observable<StrictHttpResponse<BackupDestination>> {
    return backupAdminGetDestination(this.http, this.rootUrl, params, context);
  }

  /**
   * Get destination.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `backupAdminGetDestination$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  backupAdminGetDestination(params?: BackupAdminGetDestination$Params, context?: HttpContext): Observable<BackupDestination> {
    return this.backupAdminGetDestination$Response(params, context).pipe(
      map((r: StrictHttpResponse<BackupDestination>): BackupDestination => r.body)
    );
  }

  /** Path part for operation `backupAdminPutDestination()` */
  static readonly BackupAdminPutDestinationPath = '/bff/admin/cloud-backups/destinations';

  /**
   * Put destination.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `backupAdminPutDestination()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  backupAdminPutDestination$Response(params: BackupAdminPutDestination$Params, context?: HttpContext): Observable<StrictHttpResponse<BackupDestination>> {
    return backupAdminPutDestination(this.http, this.rootUrl, params, context);
  }

  /**
   * Put destination.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `backupAdminPutDestination$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  backupAdminPutDestination(params: BackupAdminPutDestination$Params, context?: HttpContext): Observable<BackupDestination> {
    return this.backupAdminPutDestination$Response(params, context).pipe(
      map((r: StrictHttpResponse<BackupDestination>): BackupDestination => r.body)
    );
  }

  /** Path part for operation `backupAdminList()` */
  static readonly BackupAdminListPath = '/bff/admin/cloud-backups';

  /**
   * List.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `backupAdminList()` instead.
   *
   * This method doesn't expect any request body.
   */
  backupAdminList$Response(params?: BackupAdminList$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<BackupSet>>> {
    return backupAdminList(this.http, this.rootUrl, params, context);
  }

  /**
   * List.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `backupAdminList$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  backupAdminList(params?: BackupAdminList$Params, context?: HttpContext): Observable<Array<BackupSet>> {
    return this.backupAdminList$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<BackupSet>>): Array<BackupSet> => r.body)
    );
  }

  /** Path part for operation `backupAdminCreate()` */
  static readonly BackupAdminCreatePath = '/bff/admin/cloud-backups';

  /**
   * Create.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `backupAdminCreate()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  backupAdminCreate$Response(params: BackupAdminCreate$Params, context?: HttpContext): Observable<StrictHttpResponse<BackupSet>> {
    return backupAdminCreate(this.http, this.rootUrl, params, context);
  }

  /**
   * Create.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `backupAdminCreate$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  backupAdminCreate(params: BackupAdminCreate$Params, context?: HttpContext): Observable<BackupSet> {
    return this.backupAdminCreate$Response(params, context).pipe(
      map((r: StrictHttpResponse<BackupSet>): BackupSet => r.body)
    );
  }

  /** Path part for operation `backupAdminRestore()` */
  static readonly BackupAdminRestorePath = '/bff/admin/cloud-backups/{id}/restore';

  /**
   * Restore.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `backupAdminRestore()` instead.
   *
   * This method doesn't expect any request body.
   */
  backupAdminRestore$Response(params: BackupAdminRestore$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return backupAdminRestore(this.http, this.rootUrl, params, context);
  }

  /**
   * Restore.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `backupAdminRestore$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  backupAdminRestore(params: BackupAdminRestore$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.backupAdminRestore$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `backupAdminVersions()` */
  static readonly BackupAdminVersionsPath = '/bff/admin/cloud-backups/{id}/versions';

  /**
   * Versions.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `backupAdminVersions()` instead.
   *
   * This method doesn't expect any request body.
   */
  backupAdminVersions$Response(params: BackupAdminVersions$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<BackupSet>>> {
    return backupAdminVersions(this.http, this.rootUrl, params, context);
  }

  /**
   * Versions.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `backupAdminVersions$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  backupAdminVersions(params: BackupAdminVersions$Params, context?: HttpContext): Observable<Array<BackupSet>> {
    return this.backupAdminVersions$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<BackupSet>>): Array<BackupSet> => r.body)
    );
  }

  /** Path part for operation `backupAdminArtifacts()` */
  static readonly BackupAdminArtifactsPath = '/bff/admin/cloud-backups/{id}/artifacts';

  /**
   * Artifacts.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `backupAdminArtifacts()` instead.
   *
   * This method doesn't expect any request body.
   */
  backupAdminArtifacts$Response(params: BackupAdminArtifacts$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<BackupArtifact>>> {
    return backupAdminArtifacts(this.http, this.rootUrl, params, context);
  }

  /**
   * Artifacts.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `backupAdminArtifacts$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  backupAdminArtifacts(params: BackupAdminArtifacts$Params, context?: HttpContext): Observable<Array<BackupArtifact>> {
    return this.backupAdminArtifacts$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<BackupArtifact>>): Array<BackupArtifact> => r.body)
    );
  }

  /** Path part for operation `backupAdminServices()` */
  static readonly BackupAdminServicesPath = '/bff/admin/cloud-backups/services';

  /**
   * Services.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `backupAdminServices()` instead.
   *
   * This method doesn't expect any request body.
   */
  backupAdminServices$Response(params?: BackupAdminServices$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<RunningService>>> {
    return backupAdminServices(this.http, this.rootUrl, params, context);
  }

  /**
   * Services.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `backupAdminServices$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  backupAdminServices(params?: BackupAdminServices$Params, context?: HttpContext): Observable<Array<RunningService>> {
    return this.backupAdminServices$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<RunningService>>): Array<RunningService> => r.body)
    );
  }

}

/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { BackupSet } from '../models/backup-set';
import { backupSuperadminCreateTotal } from '../fn/backup-superadmin-controller/backup-superadmin-create-total';
import { BackupSuperadminCreateTotal$Params } from '../fn/backup-superadmin-controller/backup-superadmin-create-total';

@Injectable({ providedIn: 'root' })
export class BackupSuperadminControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `backupSuperadminCreateTotal()` */
  static readonly BackupSuperadminCreateTotalPath = '/bff/superadmin/cloud-backups/total';

  /**
   * Create total.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `backupSuperadminCreateTotal()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  backupSuperadminCreateTotal$Response(params: BackupSuperadminCreateTotal$Params, context?: HttpContext): Observable<StrictHttpResponse<BackupSet>> {
    return backupSuperadminCreateTotal(this.http, this.rootUrl, params, context);
  }

  /**
   * Create total.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `backupSuperadminCreateTotal$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  backupSuperadminCreateTotal(params: BackupSuperadminCreateTotal$Params, context?: HttpContext): Observable<BackupSet> {
    return this.backupSuperadminCreateTotal$Response(params, context).pipe(
      map((r: StrictHttpResponse<BackupSet>): BackupSet => r.body)
    );
  }

}

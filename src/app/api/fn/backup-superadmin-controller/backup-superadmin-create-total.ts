/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { BackupSet } from '../../models/backup-set';
import { CreateBackupRequest } from '../../models/create-backup-request';

export interface BackupSuperadminCreateTotal$Params {
      body: CreateBackupRequest
}

export function backupSuperadminCreateTotal(http: HttpClient, rootUrl: string, params: BackupSuperadminCreateTotal$Params, context?: HttpContext): Observable<StrictHttpResponse<BackupSet>> {
  const rb = new RequestBuilder(rootUrl, backupSuperadminCreateTotal.PATH, 'post');
  if (params) {
    rb.body(params.body, 'application/json');
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<BackupSet>;
    })
  );
}

backupSuperadminCreateTotal.PATH = '/bff/superadmin/cloud-backups/total';

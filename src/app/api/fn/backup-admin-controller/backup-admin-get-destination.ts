/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { BackupDestination } from '../../models/backup-destination';

export interface BackupAdminGetDestination$Params {
  domain?: string;
}

export function backupAdminGetDestination(http: HttpClient, rootUrl: string, params?: BackupAdminGetDestination$Params, context?: HttpContext): Observable<StrictHttpResponse<BackupDestination>> {
  const rb = new RequestBuilder(rootUrl, backupAdminGetDestination.PATH, 'get');
  if (params) {
    rb.query('domain', params.domain, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<BackupDestination>;
    })
  );
}

backupAdminGetDestination.PATH = '/bff/admin/cloud-backups/destinations';

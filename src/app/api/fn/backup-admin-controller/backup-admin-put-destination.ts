/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { BackupDestination } from '../../models/backup-destination';
import { BackupDestinationRequest } from '../../models/backup-destination-request';

export interface BackupAdminPutDestination$Params {
      body: BackupDestinationRequest
}

export function backupAdminPutDestination(http: HttpClient, rootUrl: string, params: BackupAdminPutDestination$Params, context?: HttpContext): Observable<StrictHttpResponse<BackupDestination>> {
  const rb = new RequestBuilder(rootUrl, backupAdminPutDestination.PATH, 'put');
  if (params) {
    rb.body(params.body, 'application/json');
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

backupAdminPutDestination.PATH = '/bff/admin/cloud-backups/destinations';

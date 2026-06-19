/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { RunningService } from '../../models/running-service';

export interface BackupAdminServices$Params {
}

export function backupAdminServices(http: HttpClient, rootUrl: string, params?: BackupAdminServices$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<RunningService>>> {
  const rb = new RequestBuilder(rootUrl, backupAdminServices.PATH, 'get');
  if (params) {
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<RunningService>>;
    })
  );
}

backupAdminServices.PATH = '/bff/admin/cloud-backups/services';

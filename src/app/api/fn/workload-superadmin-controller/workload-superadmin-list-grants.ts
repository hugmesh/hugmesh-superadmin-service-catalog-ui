/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { WorkloadConsoleGrant } from '../../models/workload-console-grant';

export interface WorkloadSuperadminListGrants$Params {
}

export function workloadSuperadminListGrants(http: HttpClient, rootUrl: string, params?: WorkloadSuperadminListGrants$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<WorkloadConsoleGrant>>> {
  const rb = new RequestBuilder(rootUrl, workloadSuperadminListGrants.PATH, 'get');
  if (params) {
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<WorkloadConsoleGrant>>;
    })
  );
}

workloadSuperadminListGrants.PATH = '/bff/superadmin/workloads/grants';

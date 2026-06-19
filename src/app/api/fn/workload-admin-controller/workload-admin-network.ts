/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { NetworkSummary } from '../../models/network-summary';

export interface WorkloadAdminNetwork$Params {
  namespace: string;
}

export function workloadAdminNetwork(http: HttpClient, rootUrl: string, params: WorkloadAdminNetwork$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<NetworkSummary>>> {
  const rb = new RequestBuilder(rootUrl, workloadAdminNetwork.PATH, 'get');
  if (params) {
    rb.path('namespace', params.namespace, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<NetworkSummary>>;
    })
  );
}

workloadAdminNetwork.PATH = '/bff/admin/workloads/network/{namespace}';

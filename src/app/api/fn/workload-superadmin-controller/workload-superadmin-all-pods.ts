/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { PodSummary } from '../../models/pod-summary';

export interface WorkloadSuperadminAllPods$Params {
}

export function workloadSuperadminAllPods(http: HttpClient, rootUrl: string, params?: WorkloadSuperadminAllPods$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<PodSummary>>> {
  const rb = new RequestBuilder(rootUrl, workloadSuperadminAllPods.PATH, 'get');
  if (params) {
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<PodSummary>>;
    })
  );
}

workloadSuperadminAllPods.PATH = '/bff/superadmin/workloads/pods';

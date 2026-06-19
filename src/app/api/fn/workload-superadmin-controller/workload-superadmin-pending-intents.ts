/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { WorkloadConsoleIntent } from '../../models/workload-console-intent';

export interface WorkloadSuperadminPendingIntents$Params {
}

export function workloadSuperadminPendingIntents(http: HttpClient, rootUrl: string, params?: WorkloadSuperadminPendingIntents$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<WorkloadConsoleIntent>>> {
  const rb = new RequestBuilder(rootUrl, workloadSuperadminPendingIntents.PATH, 'get');
  if (params) {
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<WorkloadConsoleIntent>>;
    })
  );
}

workloadSuperadminPendingIntents.PATH = '/bff/superadmin/workloads/lifecycle/pending';

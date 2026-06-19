/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { WorkloadConsoleIntent } from '../../models/workload-console-intent';
import { WorkloadLifecycleRequest } from '../../models/workload-lifecycle-request';

export interface WorkloadSuperadminLifecycle$Params {
  namespace: string;
  workload: string;
  verb: string;
      body: WorkloadLifecycleRequest
}

export function workloadSuperadminLifecycle(http: HttpClient, rootUrl: string, params: WorkloadSuperadminLifecycle$Params, context?: HttpContext): Observable<StrictHttpResponse<WorkloadConsoleIntent>> {
  const rb = new RequestBuilder(rootUrl, workloadSuperadminLifecycle.PATH, 'post');
  if (params) {
    rb.path('namespace', params.namespace, {});
    rb.path('workload', params.workload, {});
    rb.path('verb', params.verb, {});
    rb.body(params.body, 'application/json');
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<WorkloadConsoleIntent>;
    })
  );
}

workloadSuperadminLifecycle.PATH = '/bff/superadmin/workloads/lifecycle/{namespace}/{workload}/{verb}';

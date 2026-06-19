/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { ExecResult } from '../../models/exec-result';
import { WorkloadExecRequest } from '../../models/workload-exec-request';

export interface WorkloadSuperadminExecReadOnly$Params {
  namespace: string;
  pod: string;
      body: WorkloadExecRequest
}

export function workloadSuperadminExecReadOnly(http: HttpClient, rootUrl: string, params: WorkloadSuperadminExecReadOnly$Params, context?: HttpContext): Observable<StrictHttpResponse<ExecResult>> {
  const rb = new RequestBuilder(rootUrl, workloadSuperadminExecReadOnly.PATH, 'post');
  if (params) {
    rb.path('namespace', params.namespace, {});
    rb.path('pod', params.pod, {});
    rb.body(params.body, 'application/json');
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<ExecResult>;
    })
  );
}

workloadSuperadminExecReadOnly.PATH = '/bff/superadmin/workloads/exec/{namespace}/{pod}';

/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';


export interface WorkloadSuperadminDeletePod$Params {
  namespace: string;
  pod: string;
}

export function workloadSuperadminDeletePod(http: HttpClient, rootUrl: string, params: WorkloadSuperadminDeletePod$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
  const rb = new RequestBuilder(rootUrl, workloadSuperadminDeletePod.PATH, 'delete');
  if (params) {
    rb.path('namespace', params.namespace, {});
    rb.path('pod', params.pod, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<{
      [key: string]: {
      };
      }>;
    })
  );
}

workloadSuperadminDeletePod.PATH = '/bff/superadmin/workloads/pods/{namespace}/{pod}';

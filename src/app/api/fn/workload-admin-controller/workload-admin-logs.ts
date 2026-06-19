/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';


export interface WorkloadAdminLogs$Params {
  namespace: string;
  name: string;
  container?: string;
  tail?: number;
}

export function workloadAdminLogs(http: HttpClient, rootUrl: string, params: WorkloadAdminLogs$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
  const rb = new RequestBuilder(rootUrl, workloadAdminLogs.PATH, 'get');
  if (params) {
    rb.path('namespace', params.namespace, {});
    rb.path('name', params.name, {});
    rb.query('container', params.container, {});
    rb.query('tail', params.tail, {});
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

workloadAdminLogs.PATH = '/bff/admin/workloads/pods/{namespace}/{name}/logs';

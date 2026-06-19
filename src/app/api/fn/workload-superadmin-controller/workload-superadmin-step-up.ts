/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';


export interface WorkloadSuperadminStepUp$Params {
  operatorId?: string;
}

export function workloadSuperadminStepUp(http: HttpClient, rootUrl: string, params?: WorkloadSuperadminStepUp$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
  const rb = new RequestBuilder(rootUrl, workloadSuperadminStepUp.PATH, 'post');
  if (params) {
    rb.query('operatorId', params.operatorId, {});
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

workloadSuperadminStepUp.PATH = '/bff/superadmin/workloads/step-up';

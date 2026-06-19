/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';


export interface EgressVpnRevokeAssignment$Params {
  assignmentId: string;
}

export function egressVpnRevokeAssignment(http: HttpClient, rootUrl: string, params: EgressVpnRevokeAssignment$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
  const rb = new RequestBuilder(rootUrl, egressVpnRevokeAssignment.PATH, 'delete');
  if (params) {
    rb.path('assignmentId', params.assignmentId, {});
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

egressVpnRevokeAssignment.PATH = '/bff/admin/egress-vpn/assignments/{assignmentId}';

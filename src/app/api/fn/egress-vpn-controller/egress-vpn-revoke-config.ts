/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';


export interface EgressVpnRevokeConfig$Params {
  configId: string;
}

export function egressVpnRevokeConfig(http: HttpClient, rootUrl: string, params: EgressVpnRevokeConfig$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
  const rb = new RequestBuilder(rootUrl, egressVpnRevokeConfig.PATH, 'delete');
  if (params) {
    rb.path('configId', params.configId, {});
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

egressVpnRevokeConfig.PATH = '/bff/admin/egress-vpn/configs/{configId}';

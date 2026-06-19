/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { SignedVpnExport } from '../../models/signed-vpn-export';

export interface EgressVpnExport$Params {
  node: string;
}

export function egressVpnExport(http: HttpClient, rootUrl: string, params: EgressVpnExport$Params, context?: HttpContext): Observable<StrictHttpResponse<SignedVpnExport>> {
  const rb = new RequestBuilder(rootUrl, egressVpnExport.PATH, 'get');
  if (params) {
    rb.query('node', params.node, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<SignedVpnExport>;
    })
  );
}

egressVpnExport.PATH = '/bff/admin/egress-vpn/export';

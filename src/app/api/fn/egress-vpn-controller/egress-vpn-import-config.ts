/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { ImportVpnConfigRequest } from '../../models/import-vpn-config-request';
import { VpnConfig } from '../../models/vpn-config';

export interface EgressVpnImportConfig$Params {
      body: ImportVpnConfigRequest
}

export function egressVpnImportConfig(http: HttpClient, rootUrl: string, params: EgressVpnImportConfig$Params, context?: HttpContext): Observable<StrictHttpResponse<VpnConfig>> {
  const rb = new RequestBuilder(rootUrl, egressVpnImportConfig.PATH, 'post');
  if (params) {
    rb.body(params.body, 'application/json');
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<VpnConfig>;
    })
  );
}

egressVpnImportConfig.PATH = '/bff/admin/egress-vpn/configs';

/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { AssignVpnRequest } from '../../models/assign-vpn-request';
import { VpnNodeAssignment } from '../../models/vpn-node-assignment';

export interface EgressVpnAssignNode$Params {
  configId: string;
  nodeFp: string;
      body?: AssignVpnRequest
}

export function egressVpnAssignNode(http: HttpClient, rootUrl: string, params: EgressVpnAssignNode$Params, context?: HttpContext): Observable<StrictHttpResponse<VpnNodeAssignment>> {
  const rb = new RequestBuilder(rootUrl, egressVpnAssignNode.PATH, 'post');
  if (params) {
    rb.path('configId', params.configId, {});
    rb.path('nodeFp', params.nodeFp, {});
    rb.body(params.body, 'application/json');
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<VpnNodeAssignment>;
    })
  );
}

egressVpnAssignNode.PATH = '/bff/admin/egress-vpn/configs/{configId}/assign/node/{nodeFp}';

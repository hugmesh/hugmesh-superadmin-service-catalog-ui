/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { SetRolesRequest } from '../../models/set-roles-request';

export interface OidcProviderRolesSetProviderRoles$Params {
  provider: string;
      body: SetRolesRequest
}

export function oidcProviderRolesSetProviderRoles(http: HttpClient, rootUrl: string, params: OidcProviderRolesSetProviderRoles$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
  const rb = new RequestBuilder(rootUrl, oidcProviderRolesSetProviderRoles.PATH, 'put');
  if (params) {
    rb.path('provider', params.provider, {});
    rb.body(params.body, 'application/json');
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

oidcProviderRolesSetProviderRoles.PATH = '/bff/admin/oidc-providers/{provider}/roles';

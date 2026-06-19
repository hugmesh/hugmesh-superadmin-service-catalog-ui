/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';


export interface OidcProviderRolesClearProviderRoles$Params {
  provider: string;
}

export function oidcProviderRolesClearProviderRoles(http: HttpClient, rootUrl: string, params: OidcProviderRolesClearProviderRoles$Params, context?: HttpContext): Observable<StrictHttpResponse<void>> {
  const rb = new RequestBuilder(rootUrl, oidcProviderRolesClearProviderRoles.PATH, 'delete');
  if (params) {
    rb.path('provider', params.provider, {});
  }

  return http.request(
    rb.build({ responseType: 'text', accept: '*/*', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
    })
  );
}

oidcProviderRolesClearProviderRoles.PATH = '/bff/admin/oidc-providers/{provider}/roles';

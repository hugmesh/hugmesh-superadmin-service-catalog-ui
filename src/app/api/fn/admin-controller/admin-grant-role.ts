/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';


export interface AdminGrantRole$Params {
  roleName: string;
  user: string;
}

export function adminGrantRole(http: HttpClient, rootUrl: string, params: AdminGrantRole$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
  const rb = new RequestBuilder(rootUrl, adminGrantRole.PATH, 'post');
  if (params) {
    rb.path('roleName', params.roleName, {});
    rb.path('user', params.user, {});
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

adminGrantRole.PATH = '/bff/admin/roles/{roleName}/{user}';

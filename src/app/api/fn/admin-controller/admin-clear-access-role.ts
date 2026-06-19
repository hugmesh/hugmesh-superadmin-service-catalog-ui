/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';


export interface AdminClearAccessRole$Params {
  role: string;
  user: string;
}

export function adminClearAccessRole(http: HttpClient, rootUrl: string, params: AdminClearAccessRole$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
  const rb = new RequestBuilder(rootUrl, adminClearAccessRole.PATH, 'delete');
  if (params) {
    rb.path('role', params.role, {});
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

adminClearAccessRole.PATH = '/bff/admin/access-roles/{role}/{user}';

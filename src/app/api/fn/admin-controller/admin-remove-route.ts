/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';


export interface AdminRemoveRoute$Params {
  pathPrefix: string;
}

export function adminRemoveRoute(http: HttpClient, rootUrl: string, params: AdminRemoveRoute$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
  const rb = new RequestBuilder(rootUrl, adminRemoveRoute.PATH, 'delete');
  if (params) {
    rb.path('pathPrefix', params.pathPrefix, {});
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

adminRemoveRoute.PATH = '/bff/admin/routes/{pathPrefix}';

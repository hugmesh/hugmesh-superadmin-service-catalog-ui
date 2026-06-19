/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { AppProfile } from '../../models/app-profile';

export interface AppProfileGet$Params {
  name: string;
}

export function appProfileGet(http: HttpClient, rootUrl: string, params: AppProfileGet$Params, context?: HttpContext): Observable<StrictHttpResponse<AppProfile>> {
  const rb = new RequestBuilder(rootUrl, appProfileGet.PATH, 'get');
  if (params) {
    rb.path('name', params.name, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<AppProfile>;
    })
  );
}

appProfileGet.PATH = '/bff/superadmin/app-profiles/{name}';

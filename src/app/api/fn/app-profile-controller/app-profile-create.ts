/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { AppProfile } from '../../models/app-profile';
import { AppProfileRequest } from '../../models/app-profile-request';

export interface AppProfileCreate$Params {
      body: AppProfileRequest
}

export function appProfileCreate(http: HttpClient, rootUrl: string, params: AppProfileCreate$Params, context?: HttpContext): Observable<StrictHttpResponse<AppProfile>> {
  const rb = new RequestBuilder(rootUrl, appProfileCreate.PATH, 'post');
  if (params) {
    rb.body(params.body, 'application/json');
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

appProfileCreate.PATH = '/bff/superadmin/app-profiles';

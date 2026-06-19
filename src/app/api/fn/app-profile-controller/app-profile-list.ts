/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { AppProfile } from '../../models/app-profile';

export interface AppProfileList$Params {
}

export function appProfileList(http: HttpClient, rootUrl: string, params?: AppProfileList$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<AppProfile>>> {
  const rb = new RequestBuilder(rootUrl, appProfileList.PATH, 'get');
  if (params) {
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<AppProfile>>;
    })
  );
}

appProfileList.PATH = '/bff/superadmin/app-profiles';

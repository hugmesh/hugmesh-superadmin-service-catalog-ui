/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { DeviceSshDialResponse } from '../../models/device-ssh-dial-response';

export interface DesktopDialAdminList$Params {
}

export function desktopDialAdminList(http: HttpClient, rootUrl: string, params?: DesktopDialAdminList$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<DeviceSshDialResponse>>> {
  const rb = new RequestBuilder(rootUrl, desktopDialAdminList.PATH, 'get');
  if (params) {
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<DeviceSshDialResponse>>;
    })
  );
}

desktopDialAdminList.PATH = '/bff/superadmin/desktop/dials';

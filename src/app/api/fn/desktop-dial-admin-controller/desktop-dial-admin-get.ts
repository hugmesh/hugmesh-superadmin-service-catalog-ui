/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { DeviceSshDialResponse } from '../../models/device-ssh-dial-response';

export interface DesktopDialAdminGet$Params {
  deviceId: string;
}

export function desktopDialAdminGet(http: HttpClient, rootUrl: string, params: DesktopDialAdminGet$Params, context?: HttpContext): Observable<StrictHttpResponse<DeviceSshDialResponse>> {
  const rb = new RequestBuilder(rootUrl, desktopDialAdminGet.PATH, 'get');
  if (params) {
    rb.path('deviceId', params.deviceId, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<DeviceSshDialResponse>;
    })
  );
}

desktopDialAdminGet.PATH = '/bff/superadmin/desktop/dials/{deviceId}';

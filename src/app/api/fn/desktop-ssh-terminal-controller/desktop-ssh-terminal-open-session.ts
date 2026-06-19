/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { DesktopSshSessionDescriptor } from '../../models/desktop-ssh-session-descriptor';

export interface DesktopSshTerminalOpenSession$Params {
  deviceId: string;
}

export function desktopSshTerminalOpenSession(http: HttpClient, rootUrl: string, params: DesktopSshTerminalOpenSession$Params, context?: HttpContext): Observable<StrictHttpResponse<DesktopSshSessionDescriptor>> {
  const rb = new RequestBuilder(rootUrl, desktopSshTerminalOpenSession.PATH, 'post');
  if (params) {
    rb.query('deviceId', params.deviceId, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<DesktopSshSessionDescriptor>;
    })
  );
}

desktopSshTerminalOpenSession.PATH = '/bff/admin/desktop/ssh-terminal/sessions';

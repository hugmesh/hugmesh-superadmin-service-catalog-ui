/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { DesktopInstallRequest } from '../../models/desktop-install-request';
import { DesktopInstallRequestSubmit } from '../../models/desktop-install-request-submit';

export interface DesktopInstallRequestUserSubmit$Params {
      body: DesktopInstallRequestSubmit
}

export function desktopInstallRequestUserSubmit(http: HttpClient, rootUrl: string, params: DesktopInstallRequestUserSubmit$Params, context?: HttpContext): Observable<StrictHttpResponse<DesktopInstallRequest>> {
  const rb = new RequestBuilder(rootUrl, desktopInstallRequestUserSubmit.PATH, 'post');
  if (params) {
    rb.body(params.body, 'application/json');
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<DesktopInstallRequest>;
    })
  );
}

desktopInstallRequestUserSubmit.PATH = '/bff/desktop/install-requests';

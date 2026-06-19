/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';


export interface DesktopSudoEntitlementEntitlement$Params {
  subject: string;
  deviceId: string;
}

export function desktopSudoEntitlementEntitlement(http: HttpClient, rootUrl: string, params: DesktopSudoEntitlementEntitlement$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
  const rb = new RequestBuilder(rootUrl, desktopSudoEntitlementEntitlement.PATH, 'get');
  if (params) {
    rb.query('subject', params.subject, {});
    rb.query('deviceId', params.deviceId, {});
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

desktopSudoEntitlementEntitlement.PATH = '/bff/internal/desktop/sudo/entitlement';

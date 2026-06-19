/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';


export interface DeviceLicenseDeregister$Params {
  deviceId: string;
}

export function deviceLicenseDeregister(http: HttpClient, rootUrl: string, params: DeviceLicenseDeregister$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
  const rb = new RequestBuilder(rootUrl, deviceLicenseDeregister.PATH, 'delete');
  if (params) {
    rb.path('deviceId', params.deviceId, {});
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

deviceLicenseDeregister.PATH = '/bff/admin/device-licenses/{deviceId}';

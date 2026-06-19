/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';


export interface MfaEnrollmentWebauthnAssertOptions$Params {
}

export function mfaEnrollmentWebauthnAssertOptions(http: HttpClient, rootUrl: string, params?: MfaEnrollmentWebauthnAssertOptions$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
  const rb = new RequestBuilder(rootUrl, mfaEnrollmentWebauthnAssertOptions.PATH, 'post');
  if (params) {
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

mfaEnrollmentWebauthnAssertOptions.PATH = '/bff/mfa/assert/webauthn/options';

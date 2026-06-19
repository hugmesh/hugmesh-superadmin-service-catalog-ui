/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { ServiceCuration } from '../../models/service-curation';
import { ServiceCurationRequest } from '../../models/service-curation-request';

export interface ServiceCurationWithdraw$Params {
  domain: string;
      body: ServiceCurationRequest
}

export function serviceCurationWithdraw(http: HttpClient, rootUrl: string, params: ServiceCurationWithdraw$Params, context?: HttpContext): Observable<StrictHttpResponse<ServiceCuration>> {
  const rb = new RequestBuilder(rootUrl, serviceCurationWithdraw.PATH, 'post');
  if (params) {
    rb.path('domain', params.domain, {});
    rb.body(params.body, 'application/json');
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<ServiceCuration>;
    })
  );
}

serviceCurationWithdraw.PATH = '/bff/superadmin/service-store/{domain}/withdraw';

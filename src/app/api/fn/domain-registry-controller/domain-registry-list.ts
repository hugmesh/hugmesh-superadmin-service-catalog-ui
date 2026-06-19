/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { DomainResponse } from '../../models/domain-response';

export interface DomainRegistryList$Params {
}

export function domainRegistryList(http: HttpClient, rootUrl: string, params?: DomainRegistryList$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<DomainResponse>>> {
  const rb = new RequestBuilder(rootUrl, domainRegistryList.PATH, 'get');
  if (params) {
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<DomainResponse>>;
    })
  );
}

domainRegistryList.PATH = '/bff/admin/domains';

/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { CreateDomainRequest } from '../../models/create-domain-request';
import { DomainResponse } from '../../models/domain-response';

export interface DomainRegistryCreate$Params {
      body: CreateDomainRequest
}

export function domainRegistryCreate(http: HttpClient, rootUrl: string, params: DomainRegistryCreate$Params, context?: HttpContext): Observable<StrictHttpResponse<DomainResponse>> {
  const rb = new RequestBuilder(rootUrl, domainRegistryCreate.PATH, 'post');
  if (params) {
    rb.body(params.body, 'application/json');
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<DomainResponse>;
    })
  );
}

domainRegistryCreate.PATH = '/bff/admin/domains';

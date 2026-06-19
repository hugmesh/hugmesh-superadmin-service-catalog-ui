/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { DomainResponse } from '../../models/domain-response';
import { UpdateDomainRequest } from '../../models/update-domain-request';

export interface DomainRegistryUpdate$Params {
  clusterDomain: string;
      body: UpdateDomainRequest
}

export function domainRegistryUpdate(http: HttpClient, rootUrl: string, params: DomainRegistryUpdate$Params, context?: HttpContext): Observable<StrictHttpResponse<DomainResponse>> {
  const rb = new RequestBuilder(rootUrl, domainRegistryUpdate.PATH, 'put');
  if (params) {
    rb.path('clusterDomain', params.clusterDomain, {});
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

domainRegistryUpdate.PATH = '/bff/admin/domains/{clusterDomain}';

/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { ServiceDeployment } from '../../models/service-deployment';

export interface ServiceDeploymentList$Params {
  domain: string;
}

export function serviceDeploymentList(http: HttpClient, rootUrl: string, params: ServiceDeploymentList$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<ServiceDeployment>>> {
  const rb = new RequestBuilder(rootUrl, serviceDeploymentList.PATH, 'get');
  if (params) {
    rb.path('domain', params.domain, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<ServiceDeployment>>;
    })
  );
}

serviceDeploymentList.PATH = '/bff/superadmin/service-store/{domain}/deployments';

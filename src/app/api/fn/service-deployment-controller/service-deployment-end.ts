/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { ServiceDeployment } from '../../models/service-deployment';

export interface ServiceDeploymentEnd$Params {
  domain: string;
  id: string;
}

export function serviceDeploymentEnd(http: HttpClient, rootUrl: string, params: ServiceDeploymentEnd$Params, context?: HttpContext): Observable<StrictHttpResponse<ServiceDeployment>> {
  const rb = new RequestBuilder(rootUrl, serviceDeploymentEnd.PATH, 'post');
  if (params) {
    rb.path('domain', params.domain, {});
    rb.path('id', params.id, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<ServiceDeployment>;
    })
  );
}

serviceDeploymentEnd.PATH = '/bff/superadmin/service-store/{domain}/deployments/{id}/end';

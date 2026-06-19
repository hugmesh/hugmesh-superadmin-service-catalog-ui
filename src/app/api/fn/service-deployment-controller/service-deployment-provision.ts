/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { ProvisionServiceRequest } from '../../models/provision-service-request';
import { ServiceDeployment } from '../../models/service-deployment';

export interface ServiceDeploymentProvision$Params {
  domain: string;
  id: string;
      body: ProvisionServiceRequest
}

export function serviceDeploymentProvision(http: HttpClient, rootUrl: string, params: ServiceDeploymentProvision$Params, context?: HttpContext): Observable<StrictHttpResponse<ServiceDeployment>> {
  const rb = new RequestBuilder(rootUrl, serviceDeploymentProvision.PATH, 'post');
  if (params) {
    rb.path('domain', params.domain, {});
    rb.path('id', params.id, {});
    rb.body(params.body, 'application/json');
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

serviceDeploymentProvision.PATH = '/bff/superadmin/service-store/{domain}/deployments/{id}/provision';

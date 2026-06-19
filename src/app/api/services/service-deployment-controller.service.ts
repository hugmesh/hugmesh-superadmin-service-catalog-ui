/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { ServiceDeployment } from '../models/service-deployment';
import { serviceDeploymentCreate } from '../fn/service-deployment-controller/service-deployment-create';
import { ServiceDeploymentCreate$Params } from '../fn/service-deployment-controller/service-deployment-create';
import { serviceDeploymentEnd } from '../fn/service-deployment-controller/service-deployment-end';
import { ServiceDeploymentEnd$Params } from '../fn/service-deployment-controller/service-deployment-end';
import { serviceDeploymentList } from '../fn/service-deployment-controller/service-deployment-list';
import { ServiceDeploymentList$Params } from '../fn/service-deployment-controller/service-deployment-list';
import { serviceDeploymentProvision } from '../fn/service-deployment-controller/service-deployment-provision';
import { ServiceDeploymentProvision$Params } from '../fn/service-deployment-controller/service-deployment-provision';

@Injectable({ providedIn: 'root' })
export class ServiceDeploymentControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `serviceDeploymentList()` */
  static readonly ServiceDeploymentListPath = '/bff/superadmin/service-store/{domain}/deployments';

  /**
   * List.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `serviceDeploymentList()` instead.
   *
   * This method doesn't expect any request body.
   */
  serviceDeploymentList$Response(params: ServiceDeploymentList$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<ServiceDeployment>>> {
    return serviceDeploymentList(this.http, this.rootUrl, params, context);
  }

  /**
   * List.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `serviceDeploymentList$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  serviceDeploymentList(params: ServiceDeploymentList$Params, context?: HttpContext): Observable<Array<ServiceDeployment>> {
    return this.serviceDeploymentList$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<ServiceDeployment>>): Array<ServiceDeployment> => r.body)
    );
  }

  /** Path part for operation `serviceDeploymentCreate()` */
  static readonly ServiceDeploymentCreatePath = '/bff/superadmin/service-store/{domain}/deployments';

  /**
   * Create.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `serviceDeploymentCreate()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  serviceDeploymentCreate$Response(params: ServiceDeploymentCreate$Params, context?: HttpContext): Observable<StrictHttpResponse<ServiceDeployment>> {
    return serviceDeploymentCreate(this.http, this.rootUrl, params, context);
  }

  /**
   * Create.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `serviceDeploymentCreate$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  serviceDeploymentCreate(params: ServiceDeploymentCreate$Params, context?: HttpContext): Observable<ServiceDeployment> {
    return this.serviceDeploymentCreate$Response(params, context).pipe(
      map((r: StrictHttpResponse<ServiceDeployment>): ServiceDeployment => r.body)
    );
  }

  /** Path part for operation `serviceDeploymentProvision()` */
  static readonly ServiceDeploymentProvisionPath = '/bff/superadmin/service-store/{domain}/deployments/{id}/provision';

  /**
   * Provision.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `serviceDeploymentProvision()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  serviceDeploymentProvision$Response(params: ServiceDeploymentProvision$Params, context?: HttpContext): Observable<StrictHttpResponse<ServiceDeployment>> {
    return serviceDeploymentProvision(this.http, this.rootUrl, params, context);
  }

  /**
   * Provision.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `serviceDeploymentProvision$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  serviceDeploymentProvision(params: ServiceDeploymentProvision$Params, context?: HttpContext): Observable<ServiceDeployment> {
    return this.serviceDeploymentProvision$Response(params, context).pipe(
      map((r: StrictHttpResponse<ServiceDeployment>): ServiceDeployment => r.body)
    );
  }

  /** Path part for operation `serviceDeploymentEnd()` */
  static readonly ServiceDeploymentEndPath = '/bff/superadmin/service-store/{domain}/deployments/{id}/end';

  /**
   * End.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `serviceDeploymentEnd()` instead.
   *
   * This method doesn't expect any request body.
   */
  serviceDeploymentEnd$Response(params: ServiceDeploymentEnd$Params, context?: HttpContext): Observable<StrictHttpResponse<ServiceDeployment>> {
    return serviceDeploymentEnd(this.http, this.rootUrl, params, context);
  }

  /**
   * End.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `serviceDeploymentEnd$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  serviceDeploymentEnd(params: ServiceDeploymentEnd$Params, context?: HttpContext): Observable<ServiceDeployment> {
    return this.serviceDeploymentEnd$Response(params, context).pipe(
      map((r: StrictHttpResponse<ServiceDeployment>): ServiceDeployment => r.body)
    );
  }

}

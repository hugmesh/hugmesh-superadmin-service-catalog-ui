/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { domainRegistryCreate } from '../fn/domain-registry-controller/domain-registry-create';
import { DomainRegistryCreate$Params } from '../fn/domain-registry-controller/domain-registry-create';
import { domainRegistryGet } from '../fn/domain-registry-controller/domain-registry-get';
import { DomainRegistryGet$Params } from '../fn/domain-registry-controller/domain-registry-get';
import { domainRegistryList } from '../fn/domain-registry-controller/domain-registry-list';
import { DomainRegistryList$Params } from '../fn/domain-registry-controller/domain-registry-list';
import { domainRegistryUpdate } from '../fn/domain-registry-controller/domain-registry-update';
import { DomainRegistryUpdate$Params } from '../fn/domain-registry-controller/domain-registry-update';
import { DomainResponse } from '../models/domain-response';

@Injectable({ providedIn: 'root' })
export class DomainRegistryControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `domainRegistryGet()` */
  static readonly DomainRegistryGetPath = '/bff/admin/domains/{clusterDomain}';

  /**
   * Get.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `domainRegistryGet()` instead.
   *
   * This method doesn't expect any request body.
   */
  domainRegistryGet$Response(params: DomainRegistryGet$Params, context?: HttpContext): Observable<StrictHttpResponse<DomainResponse>> {
    return domainRegistryGet(this.http, this.rootUrl, params, context);
  }

  /**
   * Get.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `domainRegistryGet$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  domainRegistryGet(params: DomainRegistryGet$Params, context?: HttpContext): Observable<DomainResponse> {
    return this.domainRegistryGet$Response(params, context).pipe(
      map((r: StrictHttpResponse<DomainResponse>): DomainResponse => r.body)
    );
  }

  /** Path part for operation `domainRegistryUpdate()` */
  static readonly DomainRegistryUpdatePath = '/bff/admin/domains/{clusterDomain}';

  /**
   * Update.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `domainRegistryUpdate()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  domainRegistryUpdate$Response(params: DomainRegistryUpdate$Params, context?: HttpContext): Observable<StrictHttpResponse<DomainResponse>> {
    return domainRegistryUpdate(this.http, this.rootUrl, params, context);
  }

  /**
   * Update.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `domainRegistryUpdate$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  domainRegistryUpdate(params: DomainRegistryUpdate$Params, context?: HttpContext): Observable<DomainResponse> {
    return this.domainRegistryUpdate$Response(params, context).pipe(
      map((r: StrictHttpResponse<DomainResponse>): DomainResponse => r.body)
    );
  }

  /** Path part for operation `domainRegistryList()` */
  static readonly DomainRegistryListPath = '/bff/admin/domains';

  /**
   * List.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `domainRegistryList()` instead.
   *
   * This method doesn't expect any request body.
   */
  domainRegistryList$Response(params?: DomainRegistryList$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<DomainResponse>>> {
    return domainRegistryList(this.http, this.rootUrl, params, context);
  }

  /**
   * List.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `domainRegistryList$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  domainRegistryList(params?: DomainRegistryList$Params, context?: HttpContext): Observable<Array<DomainResponse>> {
    return this.domainRegistryList$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<DomainResponse>>): Array<DomainResponse> => r.body)
    );
  }

  /** Path part for operation `domainRegistryCreate()` */
  static readonly DomainRegistryCreatePath = '/bff/admin/domains';

  /**
   * Create.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `domainRegistryCreate()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  domainRegistryCreate$Response(params: DomainRegistryCreate$Params, context?: HttpContext): Observable<StrictHttpResponse<DomainResponse>> {
    return domainRegistryCreate(this.http, this.rootUrl, params, context);
  }

  /**
   * Create.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `domainRegistryCreate$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  domainRegistryCreate(params: DomainRegistryCreate$Params, context?: HttpContext): Observable<DomainResponse> {
    return this.domainRegistryCreate$Response(params, context).pipe(
      map((r: StrictHttpResponse<DomainResponse>): DomainResponse => r.body)
    );
  }

}

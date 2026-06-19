/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { adminServiceStoreMyDomainCatalog } from '../fn/admin-service-store-controller/admin-service-store-my-domain-catalog';
import { AdminServiceStoreMyDomainCatalog$Params } from '../fn/admin-service-store-controller/admin-service-store-my-domain-catalog';
import { ServiceCuration } from '../models/service-curation';

@Injectable({ providedIn: 'root' })
export class AdminServiceStoreControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `adminServiceStoreMyDomainCatalog()` */
  static readonly AdminServiceStoreMyDomainCatalogPath = '/bff/admin/service-store';

  /**
   * My domain catalog.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `adminServiceStoreMyDomainCatalog()` instead.
   *
   * This method doesn't expect any request body.
   */
  adminServiceStoreMyDomainCatalog$Response(params?: AdminServiceStoreMyDomainCatalog$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<ServiceCuration>>> {
    return adminServiceStoreMyDomainCatalog(this.http, this.rootUrl, params, context);
  }

  /**
   * My domain catalog.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `adminServiceStoreMyDomainCatalog$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  adminServiceStoreMyDomainCatalog(params?: AdminServiceStoreMyDomainCatalog$Params, context?: HttpContext): Observable<Array<ServiceCuration>> {
    return this.adminServiceStoreMyDomainCatalog$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<ServiceCuration>>): Array<ServiceCuration> => r.body)
    );
  }

}

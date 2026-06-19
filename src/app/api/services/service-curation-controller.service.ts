/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { ServiceCuration } from '../models/service-curation';
import { serviceCurationList } from '../fn/service-curation-controller/service-curation-list';
import { ServiceCurationList$Params } from '../fn/service-curation-controller/service-curation-list';
import { serviceCurationOffer } from '../fn/service-curation-controller/service-curation-offer';
import { ServiceCurationOffer$Params } from '../fn/service-curation-controller/service-curation-offer';
import { serviceCurationWithdraw } from '../fn/service-curation-controller/service-curation-withdraw';
import { ServiceCurationWithdraw$Params } from '../fn/service-curation-controller/service-curation-withdraw';

@Injectable({ providedIn: 'root' })
export class ServiceCurationControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `serviceCurationWithdraw()` */
  static readonly ServiceCurationWithdrawPath = '/bff/superadmin/service-store/{domain}/withdraw';

  /**
   * Withdraw.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `serviceCurationWithdraw()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  serviceCurationWithdraw$Response(params: ServiceCurationWithdraw$Params, context?: HttpContext): Observable<StrictHttpResponse<ServiceCuration>> {
    return serviceCurationWithdraw(this.http, this.rootUrl, params, context);
  }

  /**
   * Withdraw.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `serviceCurationWithdraw$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  serviceCurationWithdraw(params: ServiceCurationWithdraw$Params, context?: HttpContext): Observable<ServiceCuration> {
    return this.serviceCurationWithdraw$Response(params, context).pipe(
      map((r: StrictHttpResponse<ServiceCuration>): ServiceCuration => r.body)
    );
  }

  /** Path part for operation `serviceCurationOffer()` */
  static readonly ServiceCurationOfferPath = '/bff/superadmin/service-store/{domain}/offer';

  /**
   * Offer.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `serviceCurationOffer()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  serviceCurationOffer$Response(params: ServiceCurationOffer$Params, context?: HttpContext): Observable<StrictHttpResponse<ServiceCuration>> {
    return serviceCurationOffer(this.http, this.rootUrl, params, context);
  }

  /**
   * Offer.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `serviceCurationOffer$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  serviceCurationOffer(params: ServiceCurationOffer$Params, context?: HttpContext): Observable<ServiceCuration> {
    return this.serviceCurationOffer$Response(params, context).pipe(
      map((r: StrictHttpResponse<ServiceCuration>): ServiceCuration => r.body)
    );
  }

  /** Path part for operation `serviceCurationList()` */
  static readonly ServiceCurationListPath = '/bff/superadmin/service-store/{domain}';

  /**
   * List.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `serviceCurationList()` instead.
   *
   * This method doesn't expect any request body.
   */
  serviceCurationList$Response(params: ServiceCurationList$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<ServiceCuration>>> {
    return serviceCurationList(this.http, this.rootUrl, params, context);
  }

  /**
   * List.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `serviceCurationList$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  serviceCurationList(params: ServiceCurationList$Params, context?: HttpContext): Observable<Array<ServiceCuration>> {
    return this.serviceCurationList$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<ServiceCuration>>): Array<ServiceCuration> => r.body)
    );
  }

}

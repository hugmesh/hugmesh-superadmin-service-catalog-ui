/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { DesktopAppCatalogEntry } from '../models/desktop-app-catalog-entry';
import { desktopRegistryIndex } from '../fn/desktop-registry-controller/desktop-registry-index';
import { DesktopRegistryIndex$Params } from '../fn/desktop-registry-controller/desktop-registry-index';
import { desktopRegistryRef } from '../fn/desktop-registry-controller/desktop-registry-ref';
import { DesktopRegistryRef$Params } from '../fn/desktop-registry-controller/desktop-registry-ref';

@Injectable({ providedIn: 'root' })
export class DesktopRegistryControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `desktopRegistryIndex()` */
  static readonly DesktopRegistryIndexPath = '/bff/desktop/registry';

  /**
   * Index.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `desktopRegistryIndex()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopRegistryIndex$Response(params?: DesktopRegistryIndex$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<DesktopAppCatalogEntry>>> {
    return desktopRegistryIndex(this.http, this.rootUrl, params, context);
  }

  /**
   * Index.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `desktopRegistryIndex$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopRegistryIndex(params?: DesktopRegistryIndex$Params, context?: HttpContext): Observable<Array<DesktopAppCatalogEntry>> {
    return this.desktopRegistryIndex$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<DesktopAppCatalogEntry>>): Array<DesktopAppCatalogEntry> => r.body)
    );
  }

  /** Path part for operation `desktopRegistryRef()` */
  static readonly DesktopRegistryRefPath = '/bff/desktop/registry/refs/{appRef}';

  /**
   * Ref.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `desktopRegistryRef()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopRegistryRef$Response(params: DesktopRegistryRef$Params, context?: HttpContext): Observable<StrictHttpResponse<string>> {
    return desktopRegistryRef(this.http, this.rootUrl, params, context);
  }

  /**
   * Ref.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `desktopRegistryRef$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopRegistryRef(params: DesktopRegistryRef$Params, context?: HttpContext): Observable<string> {
    return this.desktopRegistryRef$Response(params, context).pipe(
      map((r: StrictHttpResponse<string>): string => r.body)
    );
  }

}

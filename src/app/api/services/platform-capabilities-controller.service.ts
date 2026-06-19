/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { PlatformCapabilities } from '../models/platform-capabilities';
import { platformCapabilitiesCapabilities } from '../fn/platform-capabilities-controller/platform-capabilities-capabilities';
import { PlatformCapabilitiesCapabilities$Params } from '../fn/platform-capabilities-controller/platform-capabilities-capabilities';

@Injectable({ providedIn: 'root' })
export class PlatformCapabilitiesControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `platformCapabilitiesCapabilities()` */
  static readonly PlatformCapabilitiesCapabilitiesPath = '/bff/admin/platform-capabilities';

  /**
   * Capabilities.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `platformCapabilitiesCapabilities()` instead.
   *
   * This method doesn't expect any request body.
   */
  platformCapabilitiesCapabilities$Response(params?: PlatformCapabilitiesCapabilities$Params, context?: HttpContext): Observable<StrictHttpResponse<PlatformCapabilities>> {
    return platformCapabilitiesCapabilities(this.http, this.rootUrl, params, context);
  }

  /**
   * Capabilities.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `platformCapabilitiesCapabilities$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  platformCapabilitiesCapabilities(params?: PlatformCapabilitiesCapabilities$Params, context?: HttpContext): Observable<PlatformCapabilities> {
    return this.platformCapabilitiesCapabilities$Response(params, context).pipe(
      map((r: StrictHttpResponse<PlatformCapabilities>): PlatformCapabilities => r.body)
    );
  }

}

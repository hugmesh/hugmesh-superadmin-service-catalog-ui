/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { systemAccountProvision } from '../fn/system-account-controller/system-account-provision';
import { SystemAccountProvision$Params } from '../fn/system-account-controller/system-account-provision';

@Injectable({ providedIn: 'root' })
export class SystemAccountControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `systemAccountProvision()` */
  static readonly SystemAccountProvisionPath = '/bff/admin/system-account/{domain}/provision';

  /**
   * Provision.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `systemAccountProvision()` instead.
   *
   * This method doesn't expect any request body.
   */
  systemAccountProvision$Response(params: SystemAccountProvision$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return systemAccountProvision(this.http, this.rootUrl, params, context);
  }

  /**
   * Provision.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `systemAccountProvision$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  systemAccountProvision(params: SystemAccountProvision$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.systemAccountProvision$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

}

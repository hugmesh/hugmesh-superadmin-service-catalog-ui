/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { desktopSudoEntitlementEntitlement } from '../fn/desktop-sudo-entitlement-controller/desktop-sudo-entitlement-entitlement';
import { DesktopSudoEntitlementEntitlement$Params } from '../fn/desktop-sudo-entitlement-controller/desktop-sudo-entitlement-entitlement';

@Injectable({ providedIn: 'root' })
export class DesktopSudoEntitlementControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `desktopSudoEntitlementEntitlement()` */
  static readonly DesktopSudoEntitlementEntitlementPath = '/bff/internal/desktop/sudo/entitlement';

  /**
   * Entitlement.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `desktopSudoEntitlementEntitlement()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopSudoEntitlementEntitlement$Response(params: DesktopSudoEntitlementEntitlement$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return desktopSudoEntitlementEntitlement(this.http, this.rootUrl, params, context);
  }

  /**
   * Entitlement.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `desktopSudoEntitlementEntitlement$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopSudoEntitlementEntitlement(params: DesktopSudoEntitlementEntitlement$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.desktopSudoEntitlementEntitlement$Response(params, context).pipe(
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

/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { DesktopInstallRequest } from '../models/desktop-install-request';
import { desktopInstallRequestAdminDecide } from '../fn/desktop-install-request-admin-controller/desktop-install-request-admin-decide';
import { DesktopInstallRequestAdminDecide$Params } from '../fn/desktop-install-request-admin-controller/desktop-install-request-admin-decide';
import { desktopInstallRequestAdminList } from '../fn/desktop-install-request-admin-controller/desktop-install-request-admin-list';
import { DesktopInstallRequestAdminList$Params } from '../fn/desktop-install-request-admin-controller/desktop-install-request-admin-list';

@Injectable({ providedIn: 'root' })
export class DesktopInstallRequestAdminControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `desktopInstallRequestAdminDecide()` */
  static readonly DesktopInstallRequestAdminDecidePath = '/bff/admin/desktop/install-requests/{id}/decide';

  /**
   * Decide.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `desktopInstallRequestAdminDecide()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopInstallRequestAdminDecide$Response(params: DesktopInstallRequestAdminDecide$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return desktopInstallRequestAdminDecide(this.http, this.rootUrl, params, context);
  }

  /**
   * Decide.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `desktopInstallRequestAdminDecide$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopInstallRequestAdminDecide(params: DesktopInstallRequestAdminDecide$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.desktopInstallRequestAdminDecide$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `desktopInstallRequestAdminList()` */
  static readonly DesktopInstallRequestAdminListPath = '/bff/admin/desktop/install-requests';

  /**
   * List.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `desktopInstallRequestAdminList()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopInstallRequestAdminList$Response(params?: DesktopInstallRequestAdminList$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<DesktopInstallRequest>>> {
    return desktopInstallRequestAdminList(this.http, this.rootUrl, params, context);
  }

  /**
   * List.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `desktopInstallRequestAdminList$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopInstallRequestAdminList(params?: DesktopInstallRequestAdminList$Params, context?: HttpContext): Observable<Array<DesktopInstallRequest>> {
    return this.desktopInstallRequestAdminList$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<DesktopInstallRequest>>): Array<DesktopInstallRequest> => r.body)
    );
  }

}

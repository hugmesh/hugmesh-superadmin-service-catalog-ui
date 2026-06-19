/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { desktopSudoAdminGrant } from '../fn/desktop-sudo-admin-controller/desktop-sudo-admin-grant';
import { DesktopSudoAdminGrant$Params } from '../fn/desktop-sudo-admin-controller/desktop-sudo-admin-grant';
import { desktopSudoAdminList } from '../fn/desktop-sudo-admin-controller/desktop-sudo-admin-list';
import { DesktopSudoAdminList$Params } from '../fn/desktop-sudo-admin-controller/desktop-sudo-admin-list';
import { desktopSudoAdminRevoke } from '../fn/desktop-sudo-admin-controller/desktop-sudo-admin-revoke';
import { DesktopSudoAdminRevoke$Params } from '../fn/desktop-sudo-admin-controller/desktop-sudo-admin-revoke';
import { DesktopSudoGrant } from '../models/desktop-sudo-grant';

@Injectable({ providedIn: 'root' })
export class DesktopSudoAdminControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `desktopSudoAdminGrant()` */
  static readonly DesktopSudoAdminGrantPath = '/bff/admin/desktop/sudo/grant';

  /**
   * Grant.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `desktopSudoAdminGrant()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  desktopSudoAdminGrant$Response(params: DesktopSudoAdminGrant$Params, context?: HttpContext): Observable<StrictHttpResponse<DesktopSudoGrant>> {
    return desktopSudoAdminGrant(this.http, this.rootUrl, params, context);
  }

  /**
   * Grant.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `desktopSudoAdminGrant$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  desktopSudoAdminGrant(params: DesktopSudoAdminGrant$Params, context?: HttpContext): Observable<DesktopSudoGrant> {
    return this.desktopSudoAdminGrant$Response(params, context).pipe(
      map((r: StrictHttpResponse<DesktopSudoGrant>): DesktopSudoGrant => r.body)
    );
  }

  /** Path part for operation `desktopSudoAdminList()` */
  static readonly DesktopSudoAdminListPath = '/bff/admin/desktop/sudo';

  /**
   * List.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `desktopSudoAdminList()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopSudoAdminList$Response(params?: DesktopSudoAdminList$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<DesktopSudoGrant>>> {
    return desktopSudoAdminList(this.http, this.rootUrl, params, context);
  }

  /**
   * List.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `desktopSudoAdminList$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopSudoAdminList(params?: DesktopSudoAdminList$Params, context?: HttpContext): Observable<Array<DesktopSudoGrant>> {
    return this.desktopSudoAdminList$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<DesktopSudoGrant>>): Array<DesktopSudoGrant> => r.body)
    );
  }

  /** Path part for operation `desktopSudoAdminRevoke()` */
  static readonly DesktopSudoAdminRevokePath = '/bff/admin/desktop/sudo/{grantId}';

  /**
   * Revoke.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `desktopSudoAdminRevoke()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopSudoAdminRevoke$Response(params: DesktopSudoAdminRevoke$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return desktopSudoAdminRevoke(this.http, this.rootUrl, params, context);
  }

  /**
   * Revoke.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `desktopSudoAdminRevoke$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopSudoAdminRevoke(params: DesktopSudoAdminRevoke$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.desktopSudoAdminRevoke$Response(params, context).pipe(
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

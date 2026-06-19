/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { desktopDialAdminActivate } from '../fn/desktop-dial-admin-controller/desktop-dial-admin-activate';
import { DesktopDialAdminActivate$Params } from '../fn/desktop-dial-admin-controller/desktop-dial-admin-activate';
import { desktopDialAdminGet } from '../fn/desktop-dial-admin-controller/desktop-dial-admin-get';
import { DesktopDialAdminGet$Params } from '../fn/desktop-dial-admin-controller/desktop-dial-admin-get';
import { desktopDialAdminList } from '../fn/desktop-dial-admin-controller/desktop-dial-admin-list';
import { DesktopDialAdminList$Params } from '../fn/desktop-dial-admin-controller/desktop-dial-admin-list';
import { desktopDialAdminRevoke } from '../fn/desktop-dial-admin-controller/desktop-dial-admin-revoke';
import { DesktopDialAdminRevoke$Params } from '../fn/desktop-dial-admin-controller/desktop-dial-admin-revoke';
import { DeviceSshDialResponse } from '../models/device-ssh-dial-response';

@Injectable({ providedIn: 'root' })
export class DesktopDialAdminControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `desktopDialAdminRevoke()` */
  static readonly DesktopDialAdminRevokePath = '/bff/superadmin/desktop/dials/{deviceId}/revoke';

  /**
   * Revoke.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `desktopDialAdminRevoke()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopDialAdminRevoke$Response(params: DesktopDialAdminRevoke$Params, context?: HttpContext): Observable<StrictHttpResponse<DeviceSshDialResponse>> {
    return desktopDialAdminRevoke(this.http, this.rootUrl, params, context);
  }

  /**
   * Revoke.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `desktopDialAdminRevoke$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopDialAdminRevoke(params: DesktopDialAdminRevoke$Params, context?: HttpContext): Observable<DeviceSshDialResponse> {
    return this.desktopDialAdminRevoke$Response(params, context).pipe(
      map((r: StrictHttpResponse<DeviceSshDialResponse>): DeviceSshDialResponse => r.body)
    );
  }

  /** Path part for operation `desktopDialAdminActivate()` */
  static readonly DesktopDialAdminActivatePath = '/bff/superadmin/desktop/dials/{deviceId}/activate';

  /**
   * Activate.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `desktopDialAdminActivate()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopDialAdminActivate$Response(params: DesktopDialAdminActivate$Params, context?: HttpContext): Observable<StrictHttpResponse<DeviceSshDialResponse>> {
    return desktopDialAdminActivate(this.http, this.rootUrl, params, context);
  }

  /**
   * Activate.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `desktopDialAdminActivate$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopDialAdminActivate(params: DesktopDialAdminActivate$Params, context?: HttpContext): Observable<DeviceSshDialResponse> {
    return this.desktopDialAdminActivate$Response(params, context).pipe(
      map((r: StrictHttpResponse<DeviceSshDialResponse>): DeviceSshDialResponse => r.body)
    );
  }

  /** Path part for operation `desktopDialAdminList()` */
  static readonly DesktopDialAdminListPath = '/bff/superadmin/desktop/dials';

  /**
   * List.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `desktopDialAdminList()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopDialAdminList$Response(params?: DesktopDialAdminList$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<DeviceSshDialResponse>>> {
    return desktopDialAdminList(this.http, this.rootUrl, params, context);
  }

  /**
   * List.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `desktopDialAdminList$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopDialAdminList(params?: DesktopDialAdminList$Params, context?: HttpContext): Observable<Array<DeviceSshDialResponse>> {
    return this.desktopDialAdminList$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<DeviceSshDialResponse>>): Array<DeviceSshDialResponse> => r.body)
    );
  }

  /** Path part for operation `desktopDialAdminGet()` */
  static readonly DesktopDialAdminGetPath = '/bff/superadmin/desktop/dials/{deviceId}';

  /**
   * Get.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `desktopDialAdminGet()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopDialAdminGet$Response(params: DesktopDialAdminGet$Params, context?: HttpContext): Observable<StrictHttpResponse<DeviceSshDialResponse>> {
    return desktopDialAdminGet(this.http, this.rootUrl, params, context);
  }

  /**
   * Get.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `desktopDialAdminGet$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopDialAdminGet(params: DesktopDialAdminGet$Params, context?: HttpContext): Observable<DeviceSshDialResponse> {
    return this.desktopDialAdminGet$Response(params, context).pipe(
      map((r: StrictHttpResponse<DeviceSshDialResponse>): DeviceSshDialResponse => r.body)
    );
  }

}

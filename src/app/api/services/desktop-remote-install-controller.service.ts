/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { desktopRemoteInstallRemoteInstall } from '../fn/desktop-remote-install-controller/desktop-remote-install-remote-install';
import { DesktopRemoteInstallRemoteInstall$Params } from '../fn/desktop-remote-install-controller/desktop-remote-install-remote-install';

@Injectable({ providedIn: 'root' })
export class DesktopRemoteInstallControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `desktopRemoteInstallRemoteInstall()` */
  static readonly DesktopRemoteInstallRemoteInstallPath = '/bff/admin/desktop/remote-install';

  /**
   * Remote install.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `desktopRemoteInstallRemoteInstall()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  desktopRemoteInstallRemoteInstall$Response(params: DesktopRemoteInstallRemoteInstall$Params, context?: HttpContext): Observable<StrictHttpResponse<string>> {
    return desktopRemoteInstallRemoteInstall(this.http, this.rootUrl, params, context);
  }

  /**
   * Remote install.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `desktopRemoteInstallRemoteInstall$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  desktopRemoteInstallRemoteInstall(params: DesktopRemoteInstallRemoteInstall$Params, context?: HttpContext): Observable<string> {
    return this.desktopRemoteInstallRemoteInstall$Response(params, context).pipe(
      map((r: StrictHttpResponse<string>): string => r.body)
    );
  }

}

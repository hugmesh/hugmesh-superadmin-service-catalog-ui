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
import { desktopInstallRequestUserMine } from '../fn/desktop-install-request-user-controller/desktop-install-request-user-mine';
import { DesktopInstallRequestUserMine$Params } from '../fn/desktop-install-request-user-controller/desktop-install-request-user-mine';
import { desktopInstallRequestUserSubmit } from '../fn/desktop-install-request-user-controller/desktop-install-request-user-submit';
import { DesktopInstallRequestUserSubmit$Params } from '../fn/desktop-install-request-user-controller/desktop-install-request-user-submit';

@Injectable({ providedIn: 'root' })
export class DesktopInstallRequestUserControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `desktopInstallRequestUserMine()` */
  static readonly DesktopInstallRequestUserMinePath = '/bff/desktop/install-requests';

  /**
   * Mine.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `desktopInstallRequestUserMine()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopInstallRequestUserMine$Response(params?: DesktopInstallRequestUserMine$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<DesktopInstallRequest>>> {
    return desktopInstallRequestUserMine(this.http, this.rootUrl, params, context);
  }

  /**
   * Mine.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `desktopInstallRequestUserMine$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopInstallRequestUserMine(params?: DesktopInstallRequestUserMine$Params, context?: HttpContext): Observable<Array<DesktopInstallRequest>> {
    return this.desktopInstallRequestUserMine$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<DesktopInstallRequest>>): Array<DesktopInstallRequest> => r.body)
    );
  }

  /** Path part for operation `desktopInstallRequestUserSubmit()` */
  static readonly DesktopInstallRequestUserSubmitPath = '/bff/desktop/install-requests';

  /**
   * Submit.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `desktopInstallRequestUserSubmit()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  desktopInstallRequestUserSubmit$Response(params: DesktopInstallRequestUserSubmit$Params, context?: HttpContext): Observable<StrictHttpResponse<DesktopInstallRequest>> {
    return desktopInstallRequestUserSubmit(this.http, this.rootUrl, params, context);
  }

  /**
   * Submit.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `desktopInstallRequestUserSubmit$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  desktopInstallRequestUserSubmit(params: DesktopInstallRequestUserSubmit$Params, context?: HttpContext): Observable<DesktopInstallRequest> {
    return this.desktopInstallRequestUserSubmit$Response(params, context).pipe(
      map((r: StrictHttpResponse<DesktopInstallRequest>): DesktopInstallRequest => r.body)
    );
  }

}

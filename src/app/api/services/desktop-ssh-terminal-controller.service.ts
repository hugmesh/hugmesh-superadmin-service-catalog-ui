/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { DesktopSshSessionDescriptor } from '../models/desktop-ssh-session-descriptor';
import { desktopSshTerminalOpenSession } from '../fn/desktop-ssh-terminal-controller/desktop-ssh-terminal-open-session';
import { DesktopSshTerminalOpenSession$Params } from '../fn/desktop-ssh-terminal-controller/desktop-ssh-terminal-open-session';

@Injectable({ providedIn: 'root' })
export class DesktopSshTerminalControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `desktopSshTerminalOpenSession()` */
  static readonly DesktopSshTerminalOpenSessionPath = '/bff/admin/desktop/ssh-terminal/sessions';

  /**
   * Open session.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `desktopSshTerminalOpenSession()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopSshTerminalOpenSession$Response(params: DesktopSshTerminalOpenSession$Params, context?: HttpContext): Observable<StrictHttpResponse<DesktopSshSessionDescriptor>> {
    return desktopSshTerminalOpenSession(this.http, this.rootUrl, params, context);
  }

  /**
   * Open session.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `desktopSshTerminalOpenSession$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopSshTerminalOpenSession(params: DesktopSshTerminalOpenSession$Params, context?: HttpContext): Observable<DesktopSshSessionDescriptor> {
    return this.desktopSshTerminalOpenSession$Response(params, context).pipe(
      map((r: StrictHttpResponse<DesktopSshSessionDescriptor>): DesktopSshSessionDescriptor => r.body)
    );
  }

}

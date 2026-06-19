/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { desktopStepUpMint } from '../fn/desktop-step-up-controller/desktop-step-up-mint';
import { DesktopStepUpMint$Params } from '../fn/desktop-step-up-controller/desktop-step-up-mint';
import { DesktopTerminalStepUpResponse } from '../models/desktop-terminal-step-up-response';

@Injectable({ providedIn: 'root' })
export class DesktopStepUpControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `desktopStepUpMint()` */
  static readonly DesktopStepUpMintPath = '/bff/admin/desktop/step-up';

  /**
   * Mint.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `desktopStepUpMint()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopStepUpMint$Response(params?: DesktopStepUpMint$Params, context?: HttpContext): Observable<StrictHttpResponse<DesktopTerminalStepUpResponse>> {
    return desktopStepUpMint(this.http, this.rootUrl, params, context);
  }

  /**
   * Mint.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `desktopStepUpMint$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopStepUpMint(params?: DesktopStepUpMint$Params, context?: HttpContext): Observable<DesktopTerminalStepUpResponse> {
    return this.desktopStepUpMint$Response(params, context).pipe(
      map((r: StrictHttpResponse<DesktopTerminalStepUpResponse>): DesktopTerminalStepUpResponse => r.body)
    );
  }

}

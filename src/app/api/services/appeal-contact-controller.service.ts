/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { appealContactAppealContact } from '../fn/appeal-contact-controller/appeal-contact-appeal-contact';
import { AppealContactAppealContact$Params } from '../fn/appeal-contact-controller/appeal-contact-appeal-contact';

@Injectable({ providedIn: 'root' })
export class AppealContactControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `appealContactAppealContact()` */
  static readonly AppealContactAppealContactPath = '/bff/public/appeal-contact';

  /**
   * Appeal contact.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `appealContactAppealContact()` instead.
   *
   * This method doesn't expect any request body.
   */
  appealContactAppealContact$Response(params?: AppealContactAppealContact$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: string;
}>> {
    return appealContactAppealContact(this.http, this.rootUrl, params, context);
  }

  /**
   * Appeal contact.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `appealContactAppealContact$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  appealContactAppealContact(params?: AppealContactAppealContact$Params, context?: HttpContext): Observable<{
[key: string]: string;
}> {
    return this.appealContactAppealContact$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: string;
}>): {
[key: string]: string;
} => r.body)
    );
  }

}

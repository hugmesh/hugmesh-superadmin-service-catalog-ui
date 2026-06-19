/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { mfaChallengeChallenge } from '../fn/mfa-challenge-controller/mfa-challenge-challenge';
import { MfaChallengeChallenge$Params } from '../fn/mfa-challenge-controller/mfa-challenge-challenge';

@Injectable({ providedIn: 'root' })
export class MfaChallengeControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `mfaChallengeChallenge()` */
  static readonly MfaChallengeChallengePath = '/bff/mfa/challenge';

  /**
   * Challenge.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `mfaChallengeChallenge()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  mfaChallengeChallenge$Response(params: MfaChallengeChallenge$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return mfaChallengeChallenge(this.http, this.rootUrl, params, context);
  }

  /**
   * Challenge.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `mfaChallengeChallenge$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  mfaChallengeChallenge(params: MfaChallengeChallenge$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.mfaChallengeChallenge$Response(params, context).pipe(
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

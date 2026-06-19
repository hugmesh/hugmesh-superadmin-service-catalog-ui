/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { mfaEnrollmentBeginTotp } from '../fn/mfa-enrollment-controller/mfa-enrollment-begin-totp';
import { MfaEnrollmentBeginTotp$Params } from '../fn/mfa-enrollment-controller/mfa-enrollment-begin-totp';
import { mfaEnrollmentListFactors } from '../fn/mfa-enrollment-controller/mfa-enrollment-list-factors';
import { MfaEnrollmentListFactors$Params } from '../fn/mfa-enrollment-controller/mfa-enrollment-list-factors';
import { mfaEnrollmentRegenerateRecovery } from '../fn/mfa-enrollment-controller/mfa-enrollment-regenerate-recovery';
import { MfaEnrollmentRegenerateRecovery$Params } from '../fn/mfa-enrollment-controller/mfa-enrollment-regenerate-recovery';
import { mfaEnrollmentRemoveFactor } from '../fn/mfa-enrollment-controller/mfa-enrollment-remove-factor';
import { MfaEnrollmentRemoveFactor$Params } from '../fn/mfa-enrollment-controller/mfa-enrollment-remove-factor';
import { mfaEnrollmentVerifyTotp } from '../fn/mfa-enrollment-controller/mfa-enrollment-verify-totp';
import { MfaEnrollmentVerifyTotp$Params } from '../fn/mfa-enrollment-controller/mfa-enrollment-verify-totp';
import { mfaEnrollmentWebauthnAssertOptions } from '../fn/mfa-enrollment-controller/mfa-enrollment-webauthn-assert-options';
import { MfaEnrollmentWebauthnAssertOptions$Params } from '../fn/mfa-enrollment-controller/mfa-enrollment-webauthn-assert-options';
import { mfaEnrollmentWebauthnOptions } from '../fn/mfa-enrollment-controller/mfa-enrollment-webauthn-options';
import { MfaEnrollmentWebauthnOptions$Params } from '../fn/mfa-enrollment-controller/mfa-enrollment-webauthn-options';
import { mfaEnrollmentWebauthnVerify } from '../fn/mfa-enrollment-controller/mfa-enrollment-webauthn-verify';
import { MfaEnrollmentWebauthnVerify$Params } from '../fn/mfa-enrollment-controller/mfa-enrollment-webauthn-verify';

@Injectable({ providedIn: 'root' })
export class MfaEnrollmentControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `mfaEnrollmentRegenerateRecovery()` */
  static readonly MfaEnrollmentRegenerateRecoveryPath = '/bff/mfa/recovery/regenerate';

  /**
   * Regenerate recovery.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `mfaEnrollmentRegenerateRecovery()` instead.
   *
   * This method doesn't expect any request body.
   */
  mfaEnrollmentRegenerateRecovery$Response(params?: MfaEnrollmentRegenerateRecovery$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return mfaEnrollmentRegenerateRecovery(this.http, this.rootUrl, params, context);
  }

  /**
   * Regenerate recovery.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `mfaEnrollmentRegenerateRecovery$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  mfaEnrollmentRegenerateRecovery(params?: MfaEnrollmentRegenerateRecovery$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.mfaEnrollmentRegenerateRecovery$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `mfaEnrollmentWebauthnVerify()` */
  static readonly MfaEnrollmentWebauthnVerifyPath = '/bff/mfa/enroll/webauthn/verify';

  /**
   * Webauthn verify.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `mfaEnrollmentWebauthnVerify()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  mfaEnrollmentWebauthnVerify$Response(params: MfaEnrollmentWebauthnVerify$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return mfaEnrollmentWebauthnVerify(this.http, this.rootUrl, params, context);
  }

  /**
   * Webauthn verify.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `mfaEnrollmentWebauthnVerify$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  mfaEnrollmentWebauthnVerify(params: MfaEnrollmentWebauthnVerify$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.mfaEnrollmentWebauthnVerify$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `mfaEnrollmentWebauthnOptions()` */
  static readonly MfaEnrollmentWebauthnOptionsPath = '/bff/mfa/enroll/webauthn/options';

  /**
   * Webauthn options.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `mfaEnrollmentWebauthnOptions()` instead.
   *
   * This method doesn't expect any request body.
   */
  mfaEnrollmentWebauthnOptions$Response(params?: MfaEnrollmentWebauthnOptions$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return mfaEnrollmentWebauthnOptions(this.http, this.rootUrl, params, context);
  }

  /**
   * Webauthn options.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `mfaEnrollmentWebauthnOptions$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  mfaEnrollmentWebauthnOptions(params?: MfaEnrollmentWebauthnOptions$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.mfaEnrollmentWebauthnOptions$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `mfaEnrollmentBeginTotp()` */
  static readonly MfaEnrollmentBeginTotpPath = '/bff/mfa/enroll/totp';

  /**
   * Begin totp.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `mfaEnrollmentBeginTotp()` instead.
   *
   * This method doesn't expect any request body.
   */
  mfaEnrollmentBeginTotp$Response(params?: MfaEnrollmentBeginTotp$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return mfaEnrollmentBeginTotp(this.http, this.rootUrl, params, context);
  }

  /**
   * Begin totp.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `mfaEnrollmentBeginTotp$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  mfaEnrollmentBeginTotp(params?: MfaEnrollmentBeginTotp$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.mfaEnrollmentBeginTotp$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `mfaEnrollmentVerifyTotp()` */
  static readonly MfaEnrollmentVerifyTotpPath = '/bff/mfa/enroll/totp/verify';

  /**
   * Verify totp.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `mfaEnrollmentVerifyTotp()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  mfaEnrollmentVerifyTotp$Response(params: MfaEnrollmentVerifyTotp$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return mfaEnrollmentVerifyTotp(this.http, this.rootUrl, params, context);
  }

  /**
   * Verify totp.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `mfaEnrollmentVerifyTotp$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  mfaEnrollmentVerifyTotp(params: MfaEnrollmentVerifyTotp$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.mfaEnrollmentVerifyTotp$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `mfaEnrollmentWebauthnAssertOptions()` */
  static readonly MfaEnrollmentWebauthnAssertOptionsPath = '/bff/mfa/assert/webauthn/options';

  /**
   * Webauthn assert options.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `mfaEnrollmentWebauthnAssertOptions()` instead.
   *
   * This method doesn't expect any request body.
   */
  mfaEnrollmentWebauthnAssertOptions$Response(params?: MfaEnrollmentWebauthnAssertOptions$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return mfaEnrollmentWebauthnAssertOptions(this.http, this.rootUrl, params, context);
  }

  /**
   * Webauthn assert options.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `mfaEnrollmentWebauthnAssertOptions$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  mfaEnrollmentWebauthnAssertOptions(params?: MfaEnrollmentWebauthnAssertOptions$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.mfaEnrollmentWebauthnAssertOptions$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `mfaEnrollmentListFactors()` */
  static readonly MfaEnrollmentListFactorsPath = '/bff/mfa/factors';

  /**
   * List factors.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `mfaEnrollmentListFactors()` instead.
   *
   * This method doesn't expect any request body.
   */
  mfaEnrollmentListFactors$Response(params?: MfaEnrollmentListFactors$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return mfaEnrollmentListFactors(this.http, this.rootUrl, params, context);
  }

  /**
   * List factors.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `mfaEnrollmentListFactors$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  mfaEnrollmentListFactors(params?: MfaEnrollmentListFactors$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.mfaEnrollmentListFactors$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `mfaEnrollmentRemoveFactor()` */
  static readonly MfaEnrollmentRemoveFactorPath = '/bff/mfa/factors/{id}';

  /**
   * Remove factor.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `mfaEnrollmentRemoveFactor()` instead.
   *
   * This method doesn't expect any request body.
   */
  mfaEnrollmentRemoveFactor$Response(params: MfaEnrollmentRemoveFactor$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return mfaEnrollmentRemoveFactor(this.http, this.rootUrl, params, context);
  }

  /**
   * Remove factor.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `mfaEnrollmentRemoveFactor$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  mfaEnrollmentRemoveFactor(params: MfaEnrollmentRemoveFactor$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.mfaEnrollmentRemoveFactor$Response(params, context).pipe(
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

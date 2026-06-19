/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { authComplete } from '../fn/auth-controller/auth-complete';
import { AuthComplete$Params } from '../fn/auth-controller/auth-complete';
import { authLogin } from '../fn/auth-controller/auth-login';
import { AuthLogin$Params } from '../fn/auth-controller/auth-login';
import { authMeEndpoint } from '../fn/auth-controller/auth-me-endpoint';
import { AuthMeEndpoint$Params } from '../fn/auth-controller/auth-me-endpoint';
import { authMyNamespaces } from '../fn/auth-controller/auth-my-namespaces';
import { AuthMyNamespaces$Params } from '../fn/auth-controller/auth-my-namespaces';
import { authProvisionMastodon } from '../fn/auth-controller/auth-provision-mastodon';
import { AuthProvisionMastodon$Params } from '../fn/auth-controller/auth-provision-mastodon';
import { authProvisionMatrix } from '../fn/auth-controller/auth-provision-matrix';
import { AuthProvisionMatrix$Params } from '../fn/auth-controller/auth-provision-matrix';
import { authRegisterDiscord } from '../fn/auth-controller/auth-register-discord';
import { AuthRegisterDiscord$Params } from '../fn/auth-controller/auth-register-discord';
import { authRegisterGoogle } from '../fn/auth-controller/auth-register-google';
import { AuthRegisterGoogle$Params } from '../fn/auth-controller/auth-register-google';
import { authSession } from '../fn/auth-controller/auth-session';
import { AuthSession$Params } from '../fn/auth-controller/auth-session';
import { authSessionOut } from '../fn/auth-controller/auth-session-out';
import { AuthSessionOut$Params } from '../fn/auth-controller/auth-session-out';

@Injectable({ providedIn: 'root' })
export class AuthControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `authSessionOut()` */
  static readonly AuthSessionOutPath = '/bff/sessionOut';

  /**
   * Session out.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `authSessionOut()` instead.
   *
   * This method doesn't expect any request body.
   */
  authSessionOut$Response(params?: AuthSessionOut$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return authSessionOut(this.http, this.rootUrl, params, context);
  }

  /**
   * Session out.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `authSessionOut$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  authSessionOut(params?: AuthSessionOut$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.authSessionOut$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `authRegisterGoogle()` */
  static readonly AuthRegisterGooglePath = '/bff/register/google';

  /**
   * Register google.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `authRegisterGoogle()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  authRegisterGoogle$Response(params: AuthRegisterGoogle$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return authRegisterGoogle(this.http, this.rootUrl, params, context);
  }

  /**
   * Register google.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `authRegisterGoogle$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  authRegisterGoogle(params: AuthRegisterGoogle$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.authRegisterGoogle$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `authRegisterDiscord()` */
  static readonly AuthRegisterDiscordPath = '/bff/register/discord';

  /**
   * Register discord.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `authRegisterDiscord()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  authRegisterDiscord$Response(params: AuthRegisterDiscord$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return authRegisterDiscord(this.http, this.rootUrl, params, context);
  }

  /**
   * Register discord.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `authRegisterDiscord$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  authRegisterDiscord(params: AuthRegisterDiscord$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.authRegisterDiscord$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `authComplete()` */
  static readonly AuthCompletePath = '/bff/register/complete';

  /**
   * Complete.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `authComplete()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  authComplete$Response(params?: AuthComplete$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return authComplete(this.http, this.rootUrl, params, context);
  }

  /**
   * Complete.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `authComplete$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  authComplete(params?: AuthComplete$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.authComplete$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `authProvisionMatrix()` */
  static readonly AuthProvisionMatrixPath = '/bff/provision/matrix';

  /**
   * Provision matrix.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `authProvisionMatrix()` instead.
   *
   * This method doesn't expect any request body.
   */
  authProvisionMatrix$Response(params?: AuthProvisionMatrix$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return authProvisionMatrix(this.http, this.rootUrl, params, context);
  }

  /**
   * Provision matrix.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `authProvisionMatrix$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  authProvisionMatrix(params?: AuthProvisionMatrix$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.authProvisionMatrix$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `authProvisionMastodon()` */
  static readonly AuthProvisionMastodonPath = '/bff/provision/mastodon';

  /**
   * Provision mastodon.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `authProvisionMastodon()` instead.
   *
   * This method doesn't expect any request body.
   */
  authProvisionMastodon$Response(params?: AuthProvisionMastodon$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return authProvisionMastodon(this.http, this.rootUrl, params, context);
  }

  /**
   * Provision mastodon.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `authProvisionMastodon$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  authProvisionMastodon(params?: AuthProvisionMastodon$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.authProvisionMastodon$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `authLogin()` */
  static readonly AuthLoginPath = '/bff/login';

  /**
   * Login.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `authLogin()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  authLogin$Response(params: AuthLogin$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return authLogin(this.http, this.rootUrl, params, context);
  }

  /**
   * Login.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `authLogin$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  authLogin(params: AuthLogin$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.authLogin$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `authSession()` */
  static readonly AuthSessionPath = '/bff/session';

  /**
   * Session.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `authSession()` instead.
   *
   * This method doesn't expect any request body.
   */
  authSession$Response(params?: AuthSession$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return authSession(this.http, this.rootUrl, params, context);
  }

  /**
   * Session.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `authSession$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  authSession(params?: AuthSession$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.authSession$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `authMeEndpoint()` */
  static readonly AuthMeEndpointPath = '/bff/me';

  /**
   * Me endpoint.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `authMeEndpoint()` instead.
   *
   * This method doesn't expect any request body.
   */
  authMeEndpoint$Response(params?: AuthMeEndpoint$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return authMeEndpoint(this.http, this.rootUrl, params, context);
  }

  /**
   * Me endpoint.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `authMeEndpoint$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  authMeEndpoint(params?: AuthMeEndpoint$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.authMeEndpoint$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `authMyNamespaces()` */
  static readonly AuthMyNamespacesPath = '/bff/me/namespaces';

  /**
   * My namespaces.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `authMyNamespaces()` instead.
   *
   * This method doesn't expect any request body.
   */
  authMyNamespaces$Response(params?: AuthMyNamespaces$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return authMyNamespaces(this.http, this.rootUrl, params, context);
  }

  /**
   * My namespaces.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `authMyNamespaces$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  authMyNamespaces(params?: AuthMyNamespaces$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.authMyNamespaces$Response(params, context).pipe(
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

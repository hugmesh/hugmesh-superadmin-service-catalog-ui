/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { oidcProviderRolesClearProviderRoles } from '../fn/oidc-provider-roles-controller/oidc-provider-roles-clear-provider-roles';
import { OidcProviderRolesClearProviderRoles$Params } from '../fn/oidc-provider-roles-controller/oidc-provider-roles-clear-provider-roles';
import { oidcProviderRolesListProviderRoles } from '../fn/oidc-provider-roles-controller/oidc-provider-roles-list-provider-roles';
import { OidcProviderRolesListProviderRoles$Params } from '../fn/oidc-provider-roles-controller/oidc-provider-roles-list-provider-roles';
import { oidcProviderRolesSetProviderRoles } from '../fn/oidc-provider-roles-controller/oidc-provider-roles-set-provider-roles';
import { OidcProviderRolesSetProviderRoles$Params } from '../fn/oidc-provider-roles-controller/oidc-provider-roles-set-provider-roles';

@Injectable({ providedIn: 'root' })
export class OidcProviderRolesControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `oidcProviderRolesSetProviderRoles()` */
  static readonly OidcProviderRolesSetProviderRolesPath = '/bff/admin/oidc-providers/{provider}/roles';

  /**
   * Set provider roles.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `oidcProviderRolesSetProviderRoles()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  oidcProviderRolesSetProviderRoles$Response(params: OidcProviderRolesSetProviderRoles$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return oidcProviderRolesSetProviderRoles(this.http, this.rootUrl, params, context);
  }

  /**
   * Set provider roles.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `oidcProviderRolesSetProviderRoles$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  oidcProviderRolesSetProviderRoles(params: OidcProviderRolesSetProviderRoles$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.oidcProviderRolesSetProviderRoles$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `oidcProviderRolesClearProviderRoles()` */
  static readonly OidcProviderRolesClearProviderRolesPath = '/bff/admin/oidc-providers/{provider}/roles';

  /**
   * Clear provider roles.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `oidcProviderRolesClearProviderRoles()` instead.
   *
   * This method doesn't expect any request body.
   */
  oidcProviderRolesClearProviderRoles$Response(params: OidcProviderRolesClearProviderRoles$Params, context?: HttpContext): Observable<StrictHttpResponse<void>> {
    return oidcProviderRolesClearProviderRoles(this.http, this.rootUrl, params, context);
  }

  /**
   * Clear provider roles.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `oidcProviderRolesClearProviderRoles$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  oidcProviderRolesClearProviderRoles(params: OidcProviderRolesClearProviderRoles$Params, context?: HttpContext): Observable<void> {
    return this.oidcProviderRolesClearProviderRoles$Response(params, context).pipe(
      map((r: StrictHttpResponse<void>): void => r.body)
    );
  }

  /** Path part for operation `oidcProviderRolesListProviderRoles()` */
  static readonly OidcProviderRolesListProviderRolesPath = '/bff/admin/oidc-providers/roles';

  /**
   * List provider roles.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `oidcProviderRolesListProviderRoles()` instead.
   *
   * This method doesn't expect any request body.
   */
  oidcProviderRolesListProviderRoles$Response(params?: OidcProviderRolesListProviderRoles$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return oidcProviderRolesListProviderRoles(this.http, this.rootUrl, params, context);
  }

  /**
   * List provider roles.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `oidcProviderRolesListProviderRoles$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  oidcProviderRolesListProviderRoles(params?: OidcProviderRolesListProviderRoles$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.oidcProviderRolesListProviderRoles$Response(params, context).pipe(
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

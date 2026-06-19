/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { DesktopAppCatalogEntry } from '../models/desktop-app-catalog-entry';
import { desktopCatalogAdminAdd } from '../fn/desktop-catalog-admin-controller/desktop-catalog-admin-add';
import { DesktopCatalogAdminAdd$Params } from '../fn/desktop-catalog-admin-controller/desktop-catalog-admin-add';
import { desktopCatalogAdminDisable } from '../fn/desktop-catalog-admin-controller/desktop-catalog-admin-disable';
import { DesktopCatalogAdminDisable$Params } from '../fn/desktop-catalog-admin-controller/desktop-catalog-admin-disable';
import { desktopCatalogAdminEnable } from '../fn/desktop-catalog-admin-controller/desktop-catalog-admin-enable';
import { DesktopCatalogAdminEnable$Params } from '../fn/desktop-catalog-admin-controller/desktop-catalog-admin-enable';
import { desktopCatalogAdminList } from '../fn/desktop-catalog-admin-controller/desktop-catalog-admin-list';
import { DesktopCatalogAdminList$Params } from '../fn/desktop-catalog-admin-controller/desktop-catalog-admin-list';
import { desktopCatalogAdminRemove } from '../fn/desktop-catalog-admin-controller/desktop-catalog-admin-remove';
import { DesktopCatalogAdminRemove$Params } from '../fn/desktop-catalog-admin-controller/desktop-catalog-admin-remove';

@Injectable({ providedIn: 'root' })
export class DesktopCatalogAdminControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `desktopCatalogAdminList()` */
  static readonly DesktopCatalogAdminListPath = '/bff/admin/desktop/catalog';

  /**
   * List.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `desktopCatalogAdminList()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopCatalogAdminList$Response(params?: DesktopCatalogAdminList$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<DesktopAppCatalogEntry>>> {
    return desktopCatalogAdminList(this.http, this.rootUrl, params, context);
  }

  /**
   * List.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `desktopCatalogAdminList$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopCatalogAdminList(params?: DesktopCatalogAdminList$Params, context?: HttpContext): Observable<Array<DesktopAppCatalogEntry>> {
    return this.desktopCatalogAdminList$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<DesktopAppCatalogEntry>>): Array<DesktopAppCatalogEntry> => r.body)
    );
  }

  /** Path part for operation `desktopCatalogAdminAdd()` */
  static readonly DesktopCatalogAdminAddPath = '/bff/admin/desktop/catalog';

  /**
   * Add.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `desktopCatalogAdminAdd()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  desktopCatalogAdminAdd$Response(params: DesktopCatalogAdminAdd$Params, context?: HttpContext): Observable<StrictHttpResponse<DesktopAppCatalogEntry>> {
    return desktopCatalogAdminAdd(this.http, this.rootUrl, params, context);
  }

  /**
   * Add.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `desktopCatalogAdminAdd$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  desktopCatalogAdminAdd(params: DesktopCatalogAdminAdd$Params, context?: HttpContext): Observable<DesktopAppCatalogEntry> {
    return this.desktopCatalogAdminAdd$Response(params, context).pipe(
      map((r: StrictHttpResponse<DesktopAppCatalogEntry>): DesktopAppCatalogEntry => r.body)
    );
  }

  /** Path part for operation `desktopCatalogAdminEnable()` */
  static readonly DesktopCatalogAdminEnablePath = '/bff/admin/desktop/catalog/{id}/enable';

  /**
   * Enable.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `desktopCatalogAdminEnable()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopCatalogAdminEnable$Response(params: DesktopCatalogAdminEnable$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return desktopCatalogAdminEnable(this.http, this.rootUrl, params, context);
  }

  /**
   * Enable.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `desktopCatalogAdminEnable$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopCatalogAdminEnable(params: DesktopCatalogAdminEnable$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.desktopCatalogAdminEnable$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `desktopCatalogAdminDisable()` */
  static readonly DesktopCatalogAdminDisablePath = '/bff/admin/desktop/catalog/{id}/disable';

  /**
   * Disable.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `desktopCatalogAdminDisable()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopCatalogAdminDisable$Response(params: DesktopCatalogAdminDisable$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return desktopCatalogAdminDisable(this.http, this.rootUrl, params, context);
  }

  /**
   * Disable.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `desktopCatalogAdminDisable$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopCatalogAdminDisable(params: DesktopCatalogAdminDisable$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.desktopCatalogAdminDisable$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `desktopCatalogAdminRemove()` */
  static readonly DesktopCatalogAdminRemovePath = '/bff/admin/desktop/catalog/{id}';

  /**
   * Remove.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `desktopCatalogAdminRemove()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopCatalogAdminRemove$Response(params: DesktopCatalogAdminRemove$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return desktopCatalogAdminRemove(this.http, this.rootUrl, params, context);
  }

  /**
   * Remove.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `desktopCatalogAdminRemove$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  desktopCatalogAdminRemove(params: DesktopCatalogAdminRemove$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.desktopCatalogAdminRemove$Response(params, context).pipe(
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

/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { DesktopAppCatalogEntry } from '../../models/desktop-app-catalog-entry';

export interface DesktopRegistryIndex$Params {
}

export function desktopRegistryIndex(http: HttpClient, rootUrl: string, params?: DesktopRegistryIndex$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<DesktopAppCatalogEntry>>> {
  const rb = new RequestBuilder(rootUrl, desktopRegistryIndex.PATH, 'get');
  if (params) {
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<DesktopAppCatalogEntry>>;
    })
  );
}

desktopRegistryIndex.PATH = '/bff/desktop/registry';

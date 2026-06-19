/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { SignedStorageExport } from '../../models/signed-storage-export';

export interface StoragePoolExport$Params {
  node?: string;
}

export function storagePoolExport(http: HttpClient, rootUrl: string, params?: StoragePoolExport$Params, context?: HttpContext): Observable<StrictHttpResponse<SignedStorageExport>> {
  const rb = new RequestBuilder(rootUrl, storagePoolExport.PATH, 'get');
  if (params) {
    rb.query('node', params.node, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<SignedStorageExport>;
    })
  );
}

storagePoolExport.PATH = '/bff/admin/device-storage-pools/export';

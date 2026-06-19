/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { AttachPoolRequest } from '../../models/attach-pool-request';
import { StoragePool } from '../../models/storage-pool';

export interface StoragePoolAttach$Params {
  deviceId: string;
      body: AttachPoolRequest
}

export function storagePoolAttach(http: HttpClient, rootUrl: string, params: StoragePoolAttach$Params, context?: HttpContext): Observable<StrictHttpResponse<StoragePool>> {
  const rb = new RequestBuilder(rootUrl, storagePoolAttach.PATH, 'post');
  if (params) {
    rb.path('deviceId', params.deviceId, {});
    rb.body(params.body, 'application/json');
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<StoragePool>;
    })
  );
}

storagePoolAttach.PATH = '/bff/admin/device-storage-pools/{deviceId}/pools';

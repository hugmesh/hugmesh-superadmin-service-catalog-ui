/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { DataBuffer } from '../../models/data-buffer';

export interface ImageBuildKeys$Params {
  id: string;
  'X-ImageGen-StepUp'?: string;
}

export function imageBuildKeys(http: HttpClient, rootUrl: string, params: ImageBuildKeys$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<DataBuffer>>> {
  const rb = new RequestBuilder(rootUrl, imageBuildKeys.PATH, 'get');
  if (params) {
    rb.path('id', params.id, {});
    rb.header('X-ImageGen-StepUp', params['X-ImageGen-StepUp'], {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<DataBuffer>>;
    })
  );
}

imageBuildKeys.PATH = '/bff/admin/image-builds/{id}/keys';

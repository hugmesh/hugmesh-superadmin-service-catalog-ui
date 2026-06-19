/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { ServerSentEventImageBuildEvent } from '../../models/server-sent-event-image-build-event';

export interface ImageBuildEvents$Params {
  id: string;
}

export function imageBuildEvents(http: HttpClient, rootUrl: string, params: ImageBuildEvents$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<ServerSentEventImageBuildEvent>>> {
  const rb = new RequestBuilder(rootUrl, imageBuildEvents.PATH, 'get');
  if (params) {
    rb.path('id', params.id, {});
  }

  return http.request(
    rb.build({ responseType: 'text', accept: 'text/event-stream', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<ServerSentEventImageBuildEvent>>;
    })
  );
}

imageBuildEvents.PATH = '/bff/admin/image-builds/{id}/events';

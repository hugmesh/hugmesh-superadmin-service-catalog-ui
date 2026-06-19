/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { ServerSentEventJobEvent } from '../../models/server-sent-event-job-event';

export interface BackupEvents$Params {
  id: string;
}

export function backupEvents(http: HttpClient, rootUrl: string, params: BackupEvents$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<ServerSentEventJobEvent>>> {
  const rb = new RequestBuilder(rootUrl, backupEvents.PATH, 'get');
  if (params) {
    rb.path('id', params.id, {});
  }

  return http.request(
    rb.build({ responseType: 'text', accept: 'text/event-stream', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<ServerSentEventJobEvent>>;
    })
  );
}

backupEvents.PATH = '/bff/admin/backups/{id}/events';

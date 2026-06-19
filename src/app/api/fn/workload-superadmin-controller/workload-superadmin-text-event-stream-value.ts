/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { ServerSentEventLogLine } from '../../models/server-sent-event-log-line';

export interface WorkloadSuperadminTextEventStreamValue$Params {
  namespace: string;
  pod: string;
  container?: string;
}

export function workloadSuperadminTextEventStreamValue(http: HttpClient, rootUrl: string, params: WorkloadSuperadminTextEventStreamValue$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<ServerSentEventLogLine>>> {
  const rb = new RequestBuilder(rootUrl, workloadSuperadminTextEventStreamValue.PATH, 'get');
  if (params) {
    rb.path('namespace', params.namespace, {});
    rb.path('pod', params.pod, {});
    rb.query('container', params.container, {});
  }

  return http.request(
    rb.build({ responseType: 'text', accept: 'text/event-stream', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<ServerSentEventLogLine>>;
    })
  );
}

workloadSuperadminTextEventStreamValue.PATH = '/bff/superadmin/workloads/pods/{namespace}/{pod}/logs/stream';

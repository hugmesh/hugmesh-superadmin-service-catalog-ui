/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { ServerSentEventTestRunEvent } from '../../models/server-sent-event-test-run-event';

export interface TestReportsEvents$Params {
  id: string;
}

export function testReportsEvents(http: HttpClient, rootUrl: string, params: TestReportsEvents$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<ServerSentEventTestRunEvent>>> {
  const rb = new RequestBuilder(rootUrl, testReportsEvents.PATH, 'get');
  if (params) {
    rb.path('id', params.id, {});
  }

  return http.request(
    rb.build({ responseType: 'text', accept: 'text/event-stream', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<ServerSentEventTestRunEvent>>;
    })
  );
}

testReportsEvents.PATH = '/bff/admin/test-reports/{id}/events';

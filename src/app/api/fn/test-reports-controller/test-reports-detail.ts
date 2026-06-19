/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { TestRunDetail } from '../../models/test-run-detail';

export interface TestReportsDetail$Params {
  id: string;
}

export function testReportsDetail(http: HttpClient, rootUrl: string, params: TestReportsDetail$Params, context?: HttpContext): Observable<StrictHttpResponse<TestRunDetail>> {
  const rb = new RequestBuilder(rootUrl, testReportsDetail.PATH, 'get');
  if (params) {
    rb.path('id', params.id, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<TestRunDetail>;
    })
  );
}

testReportsDetail.PATH = '/bff/admin/test-reports/{id}';

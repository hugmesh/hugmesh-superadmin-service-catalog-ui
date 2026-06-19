/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { DataBuffer } from '../models/data-buffer';
import { ServerSentEventTestRunEvent } from '../models/server-sent-event-test-run-event';
import { testReportsDetail } from '../fn/test-reports-controller/test-reports-detail';
import { TestReportsDetail$Params } from '../fn/test-reports-controller/test-reports-detail';
import { testReportsDownload } from '../fn/test-reports-controller/test-reports-download';
import { TestReportsDownload$Params } from '../fn/test-reports-controller/test-reports-download';
import { testReportsEvents } from '../fn/test-reports-controller/test-reports-events';
import { TestReportsEvents$Params } from '../fn/test-reports-controller/test-reports-events';
import { testReportsHistory } from '../fn/test-reports-controller/test-reports-history';
import { TestReportsHistory$Params } from '../fn/test-reports-controller/test-reports-history';
import { testReportsIngest } from '../fn/test-reports-controller/test-reports-ingest';
import { TestReportsIngest$Params } from '../fn/test-reports-controller/test-reports-ingest';
import { testReportsRun } from '../fn/test-reports-controller/test-reports-run';
import { TestReportsRun$Params } from '../fn/test-reports-controller/test-reports-run';
import { TestRunDetail } from '../models/test-run-detail';

@Injectable({ providedIn: 'root' })
export class TestReportsControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `testReportsIngest()` */
  static readonly TestReportsIngestPath = '/bff/admin/test-reports/{id}/ingest';

  /**
   * Ingest.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `testReportsIngest()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  testReportsIngest$Response(params: TestReportsIngest$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return testReportsIngest(this.http, this.rootUrl, params, context);
  }

  /**
   * Ingest.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `testReportsIngest$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  testReportsIngest(params: TestReportsIngest$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.testReportsIngest$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `testReportsRun()` */
  static readonly TestReportsRunPath = '/bff/admin/test-reports/run';

  /**
   * Run.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `testReportsRun()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  testReportsRun$Response(params?: TestReportsRun$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return testReportsRun(this.http, this.rootUrl, params, context);
  }

  /**
   * Run.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `testReportsRun$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  testReportsRun(params?: TestReportsRun$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.testReportsRun$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `testReportsHistory()` */
  static readonly TestReportsHistoryPath = '/bff/admin/test-reports';

  /**
   * History.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `testReportsHistory()` instead.
   *
   * This method doesn't expect any request body.
   */
  testReportsHistory$Response(params?: TestReportsHistory$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return testReportsHistory(this.http, this.rootUrl, params, context);
  }

  /**
   * History.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `testReportsHistory$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  testReportsHistory(params?: TestReportsHistory$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.testReportsHistory$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `testReportsDetail()` */
  static readonly TestReportsDetailPath = '/bff/admin/test-reports/{id}';

  /**
   * Detail.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `testReportsDetail()` instead.
   *
   * This method doesn't expect any request body.
   */
  testReportsDetail$Response(params: TestReportsDetail$Params, context?: HttpContext): Observable<StrictHttpResponse<TestRunDetail>> {
    return testReportsDetail(this.http, this.rootUrl, params, context);
  }

  /**
   * Detail.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `testReportsDetail$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  testReportsDetail(params: TestReportsDetail$Params, context?: HttpContext): Observable<TestRunDetail> {
    return this.testReportsDetail$Response(params, context).pipe(
      map((r: StrictHttpResponse<TestRunDetail>): TestRunDetail => r.body)
    );
  }

  /** Path part for operation `testReportsEvents()` */
  static readonly TestReportsEventsPath = '/bff/admin/test-reports/{id}/events';

  /**
   * Events.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `testReportsEvents()` instead.
   *
   * This method doesn't expect any request body.
   */
  testReportsEvents$Response(params: TestReportsEvents$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<ServerSentEventTestRunEvent>>> {
    return testReportsEvents(this.http, this.rootUrl, params, context);
  }

  /**
   * Events.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `testReportsEvents$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  testReportsEvents(params: TestReportsEvents$Params, context?: HttpContext): Observable<Array<ServerSentEventTestRunEvent>> {
    return this.testReportsEvents$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<ServerSentEventTestRunEvent>>): Array<ServerSentEventTestRunEvent> => r.body)
    );
  }

  /** Path part for operation `testReportsDownload()` */
  static readonly TestReportsDownloadPath = '/bff/admin/test-reports/{id}/download';

  /**
   * Download.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `testReportsDownload()` instead.
   *
   * This method doesn't expect any request body.
   */
  testReportsDownload$Response(params: TestReportsDownload$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<DataBuffer>>> {
    return testReportsDownload(this.http, this.rootUrl, params, context);
  }

  /**
   * Download.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `testReportsDownload$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  testReportsDownload(params: TestReportsDownload$Params, context?: HttpContext): Observable<Array<DataBuffer>> {
    return this.testReportsDownload$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<DataBuffer>>): Array<DataBuffer> => r.body)
    );
  }

}

/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { anubisMetrics } from '../fn/anubis-controller/anubis-metrics';
import { AnubisMetrics$Params } from '../fn/anubis-controller/anubis-metrics';
import { anubisStatus } from '../fn/anubis-controller/anubis-status';
import { AnubisStatus$Params } from '../fn/anubis-controller/anubis-status';

@Injectable({ providedIn: 'root' })
export class AnubisControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `anubisStatus()` */
  static readonly AnubisStatusPath = '/bff/admin/anubis/status';

  /**
   * Status.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `anubisStatus()` instead.
   *
   * This method doesn't expect any request body.
   */
  anubisStatus$Response(params?: AnubisStatus$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return anubisStatus(this.http, this.rootUrl, params, context);
  }

  /**
   * Status.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `anubisStatus$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  anubisStatus(params?: AnubisStatus$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.anubisStatus$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `anubisMetrics()` */
  static readonly AnubisMetricsPath = '/bff/admin/anubis/metrics';

  /**
   * Metrics.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `anubisMetrics()` instead.
   *
   * This method doesn't expect any request body.
   */
  anubisMetrics$Response(params?: AnubisMetrics$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return anubisMetrics(this.http, this.rootUrl, params, context);
  }

  /**
   * Metrics.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `anubisMetrics$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  anubisMetrics(params?: AnubisMetrics$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.anubisMetrics$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

}

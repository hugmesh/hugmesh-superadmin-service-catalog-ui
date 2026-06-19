/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { imageBuildIngestIngest } from '../fn/image-build-ingest-controller/image-build-ingest-ingest';
import { ImageBuildIngestIngest$Params } from '../fn/image-build-ingest-controller/image-build-ingest-ingest';

@Injectable({ providedIn: 'root' })
export class ImageBuildIngestControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `imageBuildIngestIngest()` */
  static readonly ImageBuildIngestIngestPath = '/bff/internal/image-builds/{id}/ingest';

  /**
   * Ingest.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `imageBuildIngestIngest()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  imageBuildIngestIngest$Response(params: ImageBuildIngestIngest$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return imageBuildIngestIngest(this.http, this.rootUrl, params, context);
  }

  /**
   * Ingest.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `imageBuildIngestIngest$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  imageBuildIngestIngest(params: ImageBuildIngestIngest$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.imageBuildIngestIngest$Response(params, context).pipe(
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

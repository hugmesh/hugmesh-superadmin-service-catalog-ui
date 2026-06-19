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
import { ImageBuild } from '../models/image-build';
import { imageBuildDetail } from '../fn/image-build-controller/image-build-detail';
import { ImageBuildDetail$Params } from '../fn/image-build-controller/image-build-detail';
import { imageBuildEvents } from '../fn/image-build-controller/image-build-events';
import { ImageBuildEvents$Params } from '../fn/image-build-controller/image-build-events';
import { imageBuildHistory } from '../fn/image-build-controller/image-build-history';
import { ImageBuildHistory$Params } from '../fn/image-build-controller/image-build-history';
import { imageBuildImage } from '../fn/image-build-controller/image-build-image';
import { ImageBuildImage$Params } from '../fn/image-build-controller/image-build-image';
import { imageBuildKeys } from '../fn/image-build-controller/image-build-keys';
import { ImageBuildKeys$Params } from '../fn/image-build-controller/image-build-keys';
import { imageBuildTrigger } from '../fn/image-build-controller/image-build-trigger';
import { ImageBuildTrigger$Params } from '../fn/image-build-controller/image-build-trigger';
import { ServerSentEventImageBuildEvent } from '../models/server-sent-event-image-build-event';

@Injectable({ providedIn: 'root' })
export class ImageBuildControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `imageBuildHistory()` */
  static readonly ImageBuildHistoryPath = '/bff/admin/image-builds';

  /**
   * History.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `imageBuildHistory()` instead.
   *
   * This method doesn't expect any request body.
   */
  imageBuildHistory$Response(params?: ImageBuildHistory$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return imageBuildHistory(this.http, this.rootUrl, params, context);
  }

  /**
   * History.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `imageBuildHistory$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  imageBuildHistory(params?: ImageBuildHistory$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.imageBuildHistory$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `imageBuildTrigger()` */
  static readonly ImageBuildTriggerPath = '/bff/admin/image-builds';

  /**
   * Trigger.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `imageBuildTrigger()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  imageBuildTrigger$Response(params: ImageBuildTrigger$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return imageBuildTrigger(this.http, this.rootUrl, params, context);
  }

  /**
   * Trigger.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `imageBuildTrigger$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  imageBuildTrigger(params: ImageBuildTrigger$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.imageBuildTrigger$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `imageBuildDetail()` */
  static readonly ImageBuildDetailPath = '/bff/admin/image-builds/{id}';

  /**
   * Detail.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `imageBuildDetail()` instead.
   *
   * This method doesn't expect any request body.
   */
  imageBuildDetail$Response(params: ImageBuildDetail$Params, context?: HttpContext): Observable<StrictHttpResponse<ImageBuild>> {
    return imageBuildDetail(this.http, this.rootUrl, params, context);
  }

  /**
   * Detail.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `imageBuildDetail$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  imageBuildDetail(params: ImageBuildDetail$Params, context?: HttpContext): Observable<ImageBuild> {
    return this.imageBuildDetail$Response(params, context).pipe(
      map((r: StrictHttpResponse<ImageBuild>): ImageBuild => r.body)
    );
  }

  /** Path part for operation `imageBuildKeys()` */
  static readonly ImageBuildKeysPath = '/bff/admin/image-builds/{id}/keys';

  /**
   * Keys.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `imageBuildKeys()` instead.
   *
   * This method doesn't expect any request body.
   */
  imageBuildKeys$Response(params: ImageBuildKeys$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<DataBuffer>>> {
    return imageBuildKeys(this.http, this.rootUrl, params, context);
  }

  /**
   * Keys.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `imageBuildKeys$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  imageBuildKeys(params: ImageBuildKeys$Params, context?: HttpContext): Observable<Array<DataBuffer>> {
    return this.imageBuildKeys$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<DataBuffer>>): Array<DataBuffer> => r.body)
    );
  }

  /** Path part for operation `imageBuildImage()` */
  static readonly ImageBuildImagePath = '/bff/admin/image-builds/{id}/image';

  /**
   * Image.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `imageBuildImage()` instead.
   *
   * This method doesn't expect any request body.
   */
  imageBuildImage$Response(params: ImageBuildImage$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<DataBuffer>>> {
    return imageBuildImage(this.http, this.rootUrl, params, context);
  }

  /**
   * Image.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `imageBuildImage$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  imageBuildImage(params: ImageBuildImage$Params, context?: HttpContext): Observable<Array<DataBuffer>> {
    return this.imageBuildImage$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<DataBuffer>>): Array<DataBuffer> => r.body)
    );
  }

  /** Path part for operation `imageBuildEvents()` */
  static readonly ImageBuildEventsPath = '/bff/admin/image-builds/{id}/events';

  /**
   * Events.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `imageBuildEvents()` instead.
   *
   * This method doesn't expect any request body.
   */
  imageBuildEvents$Response(params: ImageBuildEvents$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<ServerSentEventImageBuildEvent>>> {
    return imageBuildEvents(this.http, this.rootUrl, params, context);
  }

  /**
   * Events.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `imageBuildEvents$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  imageBuildEvents(params: ImageBuildEvents$Params, context?: HttpContext): Observable<Array<ServerSentEventImageBuildEvent>> {
    return this.imageBuildEvents$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<ServerSentEventImageBuildEvent>>): Array<ServerSentEventImageBuildEvent> => r.body)
    );
  }

}

/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { announcementSuppressionGet } from '../fn/announcement-suppression-controller/announcement-suppression-get';
import { AnnouncementSuppressionGet$Params } from '../fn/announcement-suppression-controller/announcement-suppression-get';
import { announcementSuppressionPut } from '../fn/announcement-suppression-controller/announcement-suppression-put';
import { AnnouncementSuppressionPut$Params } from '../fn/announcement-suppression-controller/announcement-suppression-put';

@Injectable({ providedIn: 'root' })
export class AnnouncementSuppressionControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `announcementSuppressionGet()` */
  static readonly AnnouncementSuppressionGetPath = '/bff/admin/announcements/suppression';

  /**
   * Get.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `announcementSuppressionGet()` instead.
   *
   * This method doesn't expect any request body.
   */
  announcementSuppressionGet$Response(params?: AnnouncementSuppressionGet$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return announcementSuppressionGet(this.http, this.rootUrl, params, context);
  }

  /**
   * Get.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `announcementSuppressionGet$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  announcementSuppressionGet(params?: AnnouncementSuppressionGet$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.announcementSuppressionGet$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `announcementSuppressionPut()` */
  static readonly AnnouncementSuppressionPutPath = '/bff/admin/announcements/suppression';

  /**
   * Put.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `announcementSuppressionPut()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  announcementSuppressionPut$Response(params: AnnouncementSuppressionPut$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return announcementSuppressionPut(this.http, this.rootUrl, params, context);
  }

  /**
   * Put.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `announcementSuppressionPut$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  announcementSuppressionPut(params: AnnouncementSuppressionPut$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.announcementSuppressionPut$Response(params, context).pipe(
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

/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { Announcement } from '../models/announcement';
import { announcementAdminCreate } from '../fn/announcement-admin-controller/announcement-admin-create';
import { AnnouncementAdminCreate$Params } from '../fn/announcement-admin-controller/announcement-admin-create';
import { announcementAdminDelete } from '../fn/announcement-admin-controller/announcement-admin-delete';
import { AnnouncementAdminDelete$Params } from '../fn/announcement-admin-controller/announcement-admin-delete';
import { announcementAdminGet } from '../fn/announcement-admin-controller/announcement-admin-get';
import { AnnouncementAdminGet$Params } from '../fn/announcement-admin-controller/announcement-admin-get';
import { announcementAdminList } from '../fn/announcement-admin-controller/announcement-admin-list';
import { AnnouncementAdminList$Params } from '../fn/announcement-admin-controller/announcement-admin-list';
import { announcementAdminUpdate } from '../fn/announcement-admin-controller/announcement-admin-update';
import { AnnouncementAdminUpdate$Params } from '../fn/announcement-admin-controller/announcement-admin-update';

@Injectable({ providedIn: 'root' })
export class AnnouncementAdminControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `announcementAdminGet()` */
  static readonly AnnouncementAdminGetPath = '/bff/admin/announcements/{id}';

  /**
   * Get.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `announcementAdminGet()` instead.
   *
   * This method doesn't expect any request body.
   */
  announcementAdminGet$Response(params: AnnouncementAdminGet$Params, context?: HttpContext): Observable<StrictHttpResponse<Announcement>> {
    return announcementAdminGet(this.http, this.rootUrl, params, context);
  }

  /**
   * Get.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `announcementAdminGet$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  announcementAdminGet(params: AnnouncementAdminGet$Params, context?: HttpContext): Observable<Announcement> {
    return this.announcementAdminGet$Response(params, context).pipe(
      map((r: StrictHttpResponse<Announcement>): Announcement => r.body)
    );
  }

  /** Path part for operation `announcementAdminUpdate()` */
  static readonly AnnouncementAdminUpdatePath = '/bff/admin/announcements/{id}';

  /**
   * Update.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `announcementAdminUpdate()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  announcementAdminUpdate$Response(params: AnnouncementAdminUpdate$Params, context?: HttpContext): Observable<StrictHttpResponse<Announcement>> {
    return announcementAdminUpdate(this.http, this.rootUrl, params, context);
  }

  /**
   * Update.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `announcementAdminUpdate$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  announcementAdminUpdate(params: AnnouncementAdminUpdate$Params, context?: HttpContext): Observable<Announcement> {
    return this.announcementAdminUpdate$Response(params, context).pipe(
      map((r: StrictHttpResponse<Announcement>): Announcement => r.body)
    );
  }

  /** Path part for operation `announcementAdminDelete()` */
  static readonly AnnouncementAdminDeletePath = '/bff/admin/announcements/{id}';

  /**
   * Delete.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `announcementAdminDelete()` instead.
   *
   * This method doesn't expect any request body.
   */
  announcementAdminDelete$Response(params: AnnouncementAdminDelete$Params, context?: HttpContext): Observable<StrictHttpResponse<void>> {
    return announcementAdminDelete(this.http, this.rootUrl, params, context);
  }

  /**
   * Delete.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `announcementAdminDelete$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  announcementAdminDelete(params: AnnouncementAdminDelete$Params, context?: HttpContext): Observable<void> {
    return this.announcementAdminDelete$Response(params, context).pipe(
      map((r: StrictHttpResponse<void>): void => r.body)
    );
  }

  /** Path part for operation `announcementAdminList()` */
  static readonly AnnouncementAdminListPath = '/bff/admin/announcements';

  /**
   * List.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `announcementAdminList()` instead.
   *
   * This method doesn't expect any request body.
   */
  announcementAdminList$Response(params?: AnnouncementAdminList$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return announcementAdminList(this.http, this.rootUrl, params, context);
  }

  /**
   * List.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `announcementAdminList$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  announcementAdminList(params?: AnnouncementAdminList$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.announcementAdminList$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `announcementAdminCreate()` */
  static readonly AnnouncementAdminCreatePath = '/bff/admin/announcements';

  /**
   * Create.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `announcementAdminCreate()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  announcementAdminCreate$Response(params: AnnouncementAdminCreate$Params, context?: HttpContext): Observable<StrictHttpResponse<Announcement>> {
    return announcementAdminCreate(this.http, this.rootUrl, params, context);
  }

  /**
   * Create.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `announcementAdminCreate$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  announcementAdminCreate(params: AnnouncementAdminCreate$Params, context?: HttpContext): Observable<Announcement> {
    return this.announcementAdminCreate$Response(params, context).pipe(
      map((r: StrictHttpResponse<Announcement>): Announcement => r.body)
    );
  }

}

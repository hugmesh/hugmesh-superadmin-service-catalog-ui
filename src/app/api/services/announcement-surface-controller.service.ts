/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { announcementSurfaceForum } from '../fn/announcement-surface-controller/announcement-surface-forum';
import { AnnouncementSurfaceForum$Params } from '../fn/announcement-surface-controller/announcement-surface-forum';
import { announcementSurfaceHome } from '../fn/announcement-surface-controller/announcement-surface-home';
import { AnnouncementSurfaceHome$Params } from '../fn/announcement-surface-controller/announcement-surface-home';
import { announcementSurfaceLogin } from '../fn/announcement-surface-controller/announcement-surface-login';
import { AnnouncementSurfaceLogin$Params } from '../fn/announcement-surface-controller/announcement-surface-login';

@Injectable({ providedIn: 'root' })
export class AnnouncementSurfaceControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `announcementSurfaceLogin()` */
  static readonly AnnouncementSurfaceLoginPath = '/bff/public/announcements/login';

  /**
   * Login.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `announcementSurfaceLogin()` instead.
   *
   * This method doesn't expect any request body.
   */
  announcementSurfaceLogin$Response(params?: AnnouncementSurfaceLogin$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return announcementSurfaceLogin(this.http, this.rootUrl, params, context);
  }

  /**
   * Login.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `announcementSurfaceLogin$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  announcementSurfaceLogin(params?: AnnouncementSurfaceLogin$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.announcementSurfaceLogin$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `announcementSurfaceHome()` */
  static readonly AnnouncementSurfaceHomePath = '/bff/announcements/home';

  /**
   * Home.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `announcementSurfaceHome()` instead.
   *
   * This method doesn't expect any request body.
   */
  announcementSurfaceHome$Response(params?: AnnouncementSurfaceHome$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return announcementSurfaceHome(this.http, this.rootUrl, params, context);
  }

  /**
   * Home.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `announcementSurfaceHome$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  announcementSurfaceHome(params?: AnnouncementSurfaceHome$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.announcementSurfaceHome$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `announcementSurfaceForum()` */
  static readonly AnnouncementSurfaceForumPath = '/bff/announcements/forum';

  /**
   * Forum.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `announcementSurfaceForum()` instead.
   *
   * This method doesn't expect any request body.
   */
  announcementSurfaceForum$Response(params?: AnnouncementSurfaceForum$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return announcementSurfaceForum(this.http, this.rootUrl, params, context);
  }

  /**
   * Forum.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `announcementSurfaceForum$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  announcementSurfaceForum(params?: AnnouncementSurfaceForum$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.announcementSurfaceForum$Response(params, context).pipe(
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

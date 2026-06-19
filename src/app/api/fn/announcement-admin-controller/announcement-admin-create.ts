/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { Announcement } from '../../models/announcement';
import { AnnouncementRequest } from '../../models/announcement-request';

export interface AnnouncementAdminCreate$Params {
      body: AnnouncementRequest
}

export function announcementAdminCreate(http: HttpClient, rootUrl: string, params: AnnouncementAdminCreate$Params, context?: HttpContext): Observable<StrictHttpResponse<Announcement>> {
  const rb = new RequestBuilder(rootUrl, announcementAdminCreate.PATH, 'post');
  if (params) {
    rb.body(params.body, 'application/json');
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Announcement>;
    })
  );
}

announcementAdminCreate.PATH = '/bff/admin/announcements';

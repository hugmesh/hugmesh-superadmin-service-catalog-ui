/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { ModerationDecisionDto } from '../../models/moderation-decision-dto';

export interface AdminDecideModeration$Params {
  id: number;
  approve: boolean;
}

export function adminDecideModeration(http: HttpClient, rootUrl: string, params: AdminDecideModeration$Params, context?: HttpContext): Observable<StrictHttpResponse<ModerationDecisionDto>> {
  const rb = new RequestBuilder(rootUrl, adminDecideModeration.PATH, 'post');
  if (params) {
    rb.path('id', params.id, {});
    rb.query('approve', params.approve, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<ModerationDecisionDto>;
    })
  );
}

adminDecideModeration.PATH = '/bff/admin/moderation/{id}/decide';

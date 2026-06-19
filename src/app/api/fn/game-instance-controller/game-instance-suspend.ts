/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { GameInstanceResponse } from '../../models/game-instance-response';

export interface GameInstanceSuspend$Params {
  id: string;
}

export function gameInstanceSuspend(http: HttpClient, rootUrl: string, params: GameInstanceSuspend$Params, context?: HttpContext): Observable<StrictHttpResponse<GameInstanceResponse>> {
  const rb = new RequestBuilder(rootUrl, gameInstanceSuspend.PATH, 'post');
  if (params) {
    rb.path('id', params.id, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<GameInstanceResponse>;
    })
  );
}

gameInstanceSuspend.PATH = '/bff/games-services/instances/{id}/suspend';

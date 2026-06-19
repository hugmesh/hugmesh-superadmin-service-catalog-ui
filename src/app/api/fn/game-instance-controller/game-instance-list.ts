/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { GameInstanceResponse } from '../../models/game-instance-response';

export interface GameInstanceList$Params {
}

export function gameInstanceList(http: HttpClient, rootUrl: string, params?: GameInstanceList$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<GameInstanceResponse>>> {
  const rb = new RequestBuilder(rootUrl, gameInstanceList.PATH, 'get');
  if (params) {
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<GameInstanceResponse>>;
    })
  );
}

gameInstanceList.PATH = '/bff/games-services/instances';

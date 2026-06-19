/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { CreateGameInstanceRequest } from '../../models/create-game-instance-request';
import { GameInstanceResponse } from '../../models/game-instance-response';

export interface GameInstanceCreate$Params {
      body: CreateGameInstanceRequest
}

export function gameInstanceCreate(http: HttpClient, rootUrl: string, params: GameInstanceCreate$Params, context?: HttpContext): Observable<StrictHttpResponse<GameInstanceResponse>> {
  const rb = new RequestBuilder(rootUrl, gameInstanceCreate.PATH, 'post');
  if (params) {
    rb.body(params.body, 'application/json');
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

gameInstanceCreate.PATH = '/bff/games-services/instances';

/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { GameDomainOfferResponse } from '../../models/game-domain-offer-response';

export interface GamesCatalogSuperadminListOffers$Params {
  domain: string;
}

export function gamesCatalogSuperadminListOffers(http: HttpClient, rootUrl: string, params: GamesCatalogSuperadminListOffers$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<GameDomainOfferResponse>>> {
  const rb = new RequestBuilder(rootUrl, gamesCatalogSuperadminListOffers.PATH, 'get');
  if (params) {
    rb.path('domain', params.domain, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<GameDomainOfferResponse>>;
    })
  );
}

gamesCatalogSuperadminListOffers.PATH = '/bff/superadmin/games-services/offers/{domain}';

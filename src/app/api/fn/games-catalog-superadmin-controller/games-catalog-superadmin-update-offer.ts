/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { GameDomainOfferRequest } from '../../models/game-domain-offer-request';
import { GameDomainOfferResponse } from '../../models/game-domain-offer-response';

export interface GamesCatalogSuperadminUpdateOffer$Params {
  domain: string;
  slug: string;
      body: GameDomainOfferRequest
}

export function gamesCatalogSuperadminUpdateOffer(http: HttpClient, rootUrl: string, params: GamesCatalogSuperadminUpdateOffer$Params, context?: HttpContext): Observable<StrictHttpResponse<GameDomainOfferResponse>> {
  const rb = new RequestBuilder(rootUrl, gamesCatalogSuperadminUpdateOffer.PATH, 'put');
  if (params) {
    rb.path('domain', params.domain, {});
    rb.path('slug', params.slug, {});
    rb.body(params.body, 'application/json');
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<GameDomainOfferResponse>;
    })
  );
}

gamesCatalogSuperadminUpdateOffer.PATH = '/bff/superadmin/games-services/offers/{domain}/{slug}';

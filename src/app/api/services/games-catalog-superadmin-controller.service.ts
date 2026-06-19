/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { GameCatalogEntryResponse } from '../models/game-catalog-entry-response';
import { GameDomainOfferResponse } from '../models/game-domain-offer-response';
import { gamesCatalogSuperadminCreateCatalog } from '../fn/games-catalog-superadmin-controller/games-catalog-superadmin-create-catalog';
import { GamesCatalogSuperadminCreateCatalog$Params } from '../fn/games-catalog-superadmin-controller/games-catalog-superadmin-create-catalog';
import { gamesCatalogSuperadminCreateOffer } from '../fn/games-catalog-superadmin-controller/games-catalog-superadmin-create-offer';
import { GamesCatalogSuperadminCreateOffer$Params } from '../fn/games-catalog-superadmin-controller/games-catalog-superadmin-create-offer';
import { gamesCatalogSuperadminGetCatalog } from '../fn/games-catalog-superadmin-controller/games-catalog-superadmin-get-catalog';
import { GamesCatalogSuperadminGetCatalog$Params } from '../fn/games-catalog-superadmin-controller/games-catalog-superadmin-get-catalog';
import { gamesCatalogSuperadminListCatalog } from '../fn/games-catalog-superadmin-controller/games-catalog-superadmin-list-catalog';
import { GamesCatalogSuperadminListCatalog$Params } from '../fn/games-catalog-superadmin-controller/games-catalog-superadmin-list-catalog';
import { gamesCatalogSuperadminListOffers } from '../fn/games-catalog-superadmin-controller/games-catalog-superadmin-list-offers';
import { GamesCatalogSuperadminListOffers$Params } from '../fn/games-catalog-superadmin-controller/games-catalog-superadmin-list-offers';
import { gamesCatalogSuperadminUpdateCatalog } from '../fn/games-catalog-superadmin-controller/games-catalog-superadmin-update-catalog';
import { GamesCatalogSuperadminUpdateCatalog$Params } from '../fn/games-catalog-superadmin-controller/games-catalog-superadmin-update-catalog';
import { gamesCatalogSuperadminUpdateOffer } from '../fn/games-catalog-superadmin-controller/games-catalog-superadmin-update-offer';
import { GamesCatalogSuperadminUpdateOffer$Params } from '../fn/games-catalog-superadmin-controller/games-catalog-superadmin-update-offer';

@Injectable({ providedIn: 'root' })
export class GamesCatalogSuperadminControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `gamesCatalogSuperadminUpdateOffer()` */
  static readonly GamesCatalogSuperadminUpdateOfferPath = '/bff/superadmin/games-services/offers/{domain}/{slug}';

  /**
   * Update offer.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `gamesCatalogSuperadminUpdateOffer()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  gamesCatalogSuperadminUpdateOffer$Response(params: GamesCatalogSuperadminUpdateOffer$Params, context?: HttpContext): Observable<StrictHttpResponse<GameDomainOfferResponse>> {
    return gamesCatalogSuperadminUpdateOffer(this.http, this.rootUrl, params, context);
  }

  /**
   * Update offer.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `gamesCatalogSuperadminUpdateOffer$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  gamesCatalogSuperadminUpdateOffer(params: GamesCatalogSuperadminUpdateOffer$Params, context?: HttpContext): Observable<GameDomainOfferResponse> {
    return this.gamesCatalogSuperadminUpdateOffer$Response(params, context).pipe(
      map((r: StrictHttpResponse<GameDomainOfferResponse>): GameDomainOfferResponse => r.body)
    );
  }

  /** Path part for operation `gamesCatalogSuperadminGetCatalog()` */
  static readonly GamesCatalogSuperadminGetCatalogPath = '/bff/superadmin/games-services/catalog/{slug}';

  /**
   * Get catalog.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `gamesCatalogSuperadminGetCatalog()` instead.
   *
   * This method doesn't expect any request body.
   */
  gamesCatalogSuperadminGetCatalog$Response(params: GamesCatalogSuperadminGetCatalog$Params, context?: HttpContext): Observable<StrictHttpResponse<GameCatalogEntryResponse>> {
    return gamesCatalogSuperadminGetCatalog(this.http, this.rootUrl, params, context);
  }

  /**
   * Get catalog.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `gamesCatalogSuperadminGetCatalog$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  gamesCatalogSuperadminGetCatalog(params: GamesCatalogSuperadminGetCatalog$Params, context?: HttpContext): Observable<GameCatalogEntryResponse> {
    return this.gamesCatalogSuperadminGetCatalog$Response(params, context).pipe(
      map((r: StrictHttpResponse<GameCatalogEntryResponse>): GameCatalogEntryResponse => r.body)
    );
  }

  /** Path part for operation `gamesCatalogSuperadminUpdateCatalog()` */
  static readonly GamesCatalogSuperadminUpdateCatalogPath = '/bff/superadmin/games-services/catalog/{slug}';

  /**
   * Update catalog.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `gamesCatalogSuperadminUpdateCatalog()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  gamesCatalogSuperadminUpdateCatalog$Response(params: GamesCatalogSuperadminUpdateCatalog$Params, context?: HttpContext): Observable<StrictHttpResponse<GameCatalogEntryResponse>> {
    return gamesCatalogSuperadminUpdateCatalog(this.http, this.rootUrl, params, context);
  }

  /**
   * Update catalog.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `gamesCatalogSuperadminUpdateCatalog$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  gamesCatalogSuperadminUpdateCatalog(params: GamesCatalogSuperadminUpdateCatalog$Params, context?: HttpContext): Observable<GameCatalogEntryResponse> {
    return this.gamesCatalogSuperadminUpdateCatalog$Response(params, context).pipe(
      map((r: StrictHttpResponse<GameCatalogEntryResponse>): GameCatalogEntryResponse => r.body)
    );
  }

  /** Path part for operation `gamesCatalogSuperadminListOffers()` */
  static readonly GamesCatalogSuperadminListOffersPath = '/bff/superadmin/games-services/offers/{domain}';

  /**
   * List offers.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `gamesCatalogSuperadminListOffers()` instead.
   *
   * This method doesn't expect any request body.
   */
  gamesCatalogSuperadminListOffers$Response(params: GamesCatalogSuperadminListOffers$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<GameDomainOfferResponse>>> {
    return gamesCatalogSuperadminListOffers(this.http, this.rootUrl, params, context);
  }

  /**
   * List offers.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `gamesCatalogSuperadminListOffers$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  gamesCatalogSuperadminListOffers(params: GamesCatalogSuperadminListOffers$Params, context?: HttpContext): Observable<Array<GameDomainOfferResponse>> {
    return this.gamesCatalogSuperadminListOffers$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<GameDomainOfferResponse>>): Array<GameDomainOfferResponse> => r.body)
    );
  }

  /** Path part for operation `gamesCatalogSuperadminCreateOffer()` */
  static readonly GamesCatalogSuperadminCreateOfferPath = '/bff/superadmin/games-services/offers/{domain}';

  /**
   * Create offer.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `gamesCatalogSuperadminCreateOffer()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  gamesCatalogSuperadminCreateOffer$Response(params: GamesCatalogSuperadminCreateOffer$Params, context?: HttpContext): Observable<StrictHttpResponse<GameDomainOfferResponse>> {
    return gamesCatalogSuperadminCreateOffer(this.http, this.rootUrl, params, context);
  }

  /**
   * Create offer.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `gamesCatalogSuperadminCreateOffer$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  gamesCatalogSuperadminCreateOffer(params: GamesCatalogSuperadminCreateOffer$Params, context?: HttpContext): Observable<GameDomainOfferResponse> {
    return this.gamesCatalogSuperadminCreateOffer$Response(params, context).pipe(
      map((r: StrictHttpResponse<GameDomainOfferResponse>): GameDomainOfferResponse => r.body)
    );
  }

  /** Path part for operation `gamesCatalogSuperadminListCatalog()` */
  static readonly GamesCatalogSuperadminListCatalogPath = '/bff/superadmin/games-services/catalog';

  /**
   * List catalog.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `gamesCatalogSuperadminListCatalog()` instead.
   *
   * This method doesn't expect any request body.
   */
  gamesCatalogSuperadminListCatalog$Response(params?: GamesCatalogSuperadminListCatalog$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<GameCatalogEntryResponse>>> {
    return gamesCatalogSuperadminListCatalog(this.http, this.rootUrl, params, context);
  }

  /**
   * List catalog.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `gamesCatalogSuperadminListCatalog$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  gamesCatalogSuperadminListCatalog(params?: GamesCatalogSuperadminListCatalog$Params, context?: HttpContext): Observable<Array<GameCatalogEntryResponse>> {
    return this.gamesCatalogSuperadminListCatalog$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<GameCatalogEntryResponse>>): Array<GameCatalogEntryResponse> => r.body)
    );
  }

  /** Path part for operation `gamesCatalogSuperadminCreateCatalog()` */
  static readonly GamesCatalogSuperadminCreateCatalogPath = '/bff/superadmin/games-services/catalog';

  /**
   * Create catalog.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `gamesCatalogSuperadminCreateCatalog()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  gamesCatalogSuperadminCreateCatalog$Response(params: GamesCatalogSuperadminCreateCatalog$Params, context?: HttpContext): Observable<StrictHttpResponse<GameCatalogEntryResponse>> {
    return gamesCatalogSuperadminCreateCatalog(this.http, this.rootUrl, params, context);
  }

  /**
   * Create catalog.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `gamesCatalogSuperadminCreateCatalog$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  gamesCatalogSuperadminCreateCatalog(params: GamesCatalogSuperadminCreateCatalog$Params, context?: HttpContext): Observable<GameCatalogEntryResponse> {
    return this.gamesCatalogSuperadminCreateCatalog$Response(params, context).pipe(
      map((r: StrictHttpResponse<GameCatalogEntryResponse>): GameCatalogEntryResponse => r.body)
    );
  }

}

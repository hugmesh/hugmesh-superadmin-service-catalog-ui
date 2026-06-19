/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { gameInstanceConnection } from '../fn/game-instance-controller/game-instance-connection';
import { GameInstanceConnection$Params } from '../fn/game-instance-controller/game-instance-connection';
import { GameInstanceConnectionResponse } from '../models/game-instance-connection-response';
import { gameInstanceCreate } from '../fn/game-instance-controller/game-instance-create';
import { GameInstanceCreate$Params } from '../fn/game-instance-controller/game-instance-create';
import { gameInstanceGet } from '../fn/game-instance-controller/game-instance-get';
import { GameInstanceGet$Params } from '../fn/game-instance-controller/game-instance-get';
import { gameInstanceList } from '../fn/game-instance-controller/game-instance-list';
import { GameInstanceList$Params } from '../fn/game-instance-controller/game-instance-list';
import { GameInstanceResponse } from '../models/game-instance-response';
import { gameInstanceResume } from '../fn/game-instance-controller/game-instance-resume';
import { GameInstanceResume$Params } from '../fn/game-instance-controller/game-instance-resume';
import { gameInstanceSuspend } from '../fn/game-instance-controller/game-instance-suspend';
import { GameInstanceSuspend$Params } from '../fn/game-instance-controller/game-instance-suspend';
import { gameInstanceTerminate } from '../fn/game-instance-controller/game-instance-terminate';
import { GameInstanceTerminate$Params } from '../fn/game-instance-controller/game-instance-terminate';

@Injectable({ providedIn: 'root' })
export class GameInstanceControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `gameInstanceList()` */
  static readonly GameInstanceListPath = '/bff/games-services/instances';

  /**
   * List.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `gameInstanceList()` instead.
   *
   * This method doesn't expect any request body.
   */
  gameInstanceList$Response(params?: GameInstanceList$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<GameInstanceResponse>>> {
    return gameInstanceList(this.http, this.rootUrl, params, context);
  }

  /**
   * List.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `gameInstanceList$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  gameInstanceList(params?: GameInstanceList$Params, context?: HttpContext): Observable<Array<GameInstanceResponse>> {
    return this.gameInstanceList$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<GameInstanceResponse>>): Array<GameInstanceResponse> => r.body)
    );
  }

  /** Path part for operation `gameInstanceCreate()` */
  static readonly GameInstanceCreatePath = '/bff/games-services/instances';

  /**
   * Create.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `gameInstanceCreate()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  gameInstanceCreate$Response(params: GameInstanceCreate$Params, context?: HttpContext): Observable<StrictHttpResponse<GameInstanceResponse>> {
    return gameInstanceCreate(this.http, this.rootUrl, params, context);
  }

  /**
   * Create.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `gameInstanceCreate$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  gameInstanceCreate(params: GameInstanceCreate$Params, context?: HttpContext): Observable<GameInstanceResponse> {
    return this.gameInstanceCreate$Response(params, context).pipe(
      map((r: StrictHttpResponse<GameInstanceResponse>): GameInstanceResponse => r.body)
    );
  }

  /** Path part for operation `gameInstanceTerminate()` */
  static readonly GameInstanceTerminatePath = '/bff/games-services/instances/{id}/terminate';

  /**
   * Terminate.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `gameInstanceTerminate()` instead.
   *
   * This method doesn't expect any request body.
   */
  gameInstanceTerminate$Response(params: GameInstanceTerminate$Params, context?: HttpContext): Observable<StrictHttpResponse<GameInstanceResponse>> {
    return gameInstanceTerminate(this.http, this.rootUrl, params, context);
  }

  /**
   * Terminate.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `gameInstanceTerminate$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  gameInstanceTerminate(params: GameInstanceTerminate$Params, context?: HttpContext): Observable<GameInstanceResponse> {
    return this.gameInstanceTerminate$Response(params, context).pipe(
      map((r: StrictHttpResponse<GameInstanceResponse>): GameInstanceResponse => r.body)
    );
  }

  /** Path part for operation `gameInstanceSuspend()` */
  static readonly GameInstanceSuspendPath = '/bff/games-services/instances/{id}/suspend';

  /**
   * Suspend.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `gameInstanceSuspend()` instead.
   *
   * This method doesn't expect any request body.
   */
  gameInstanceSuspend$Response(params: GameInstanceSuspend$Params, context?: HttpContext): Observable<StrictHttpResponse<GameInstanceResponse>> {
    return gameInstanceSuspend(this.http, this.rootUrl, params, context);
  }

  /**
   * Suspend.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `gameInstanceSuspend$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  gameInstanceSuspend(params: GameInstanceSuspend$Params, context?: HttpContext): Observable<GameInstanceResponse> {
    return this.gameInstanceSuspend$Response(params, context).pipe(
      map((r: StrictHttpResponse<GameInstanceResponse>): GameInstanceResponse => r.body)
    );
  }

  /** Path part for operation `gameInstanceResume()` */
  static readonly GameInstanceResumePath = '/bff/games-services/instances/{id}/resume';

  /**
   * Resume.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `gameInstanceResume()` instead.
   *
   * This method doesn't expect any request body.
   */
  gameInstanceResume$Response(params: GameInstanceResume$Params, context?: HttpContext): Observable<StrictHttpResponse<GameInstanceResponse>> {
    return gameInstanceResume(this.http, this.rootUrl, params, context);
  }

  /**
   * Resume.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `gameInstanceResume$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  gameInstanceResume(params: GameInstanceResume$Params, context?: HttpContext): Observable<GameInstanceResponse> {
    return this.gameInstanceResume$Response(params, context).pipe(
      map((r: StrictHttpResponse<GameInstanceResponse>): GameInstanceResponse => r.body)
    );
  }

  /** Path part for operation `gameInstanceGet()` */
  static readonly GameInstanceGetPath = '/bff/games-services/instances/{id}';

  /**
   * Get.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `gameInstanceGet()` instead.
   *
   * This method doesn't expect any request body.
   */
  gameInstanceGet$Response(params: GameInstanceGet$Params, context?: HttpContext): Observable<StrictHttpResponse<GameInstanceResponse>> {
    return gameInstanceGet(this.http, this.rootUrl, params, context);
  }

  /**
   * Get.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `gameInstanceGet$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  gameInstanceGet(params: GameInstanceGet$Params, context?: HttpContext): Observable<GameInstanceResponse> {
    return this.gameInstanceGet$Response(params, context).pipe(
      map((r: StrictHttpResponse<GameInstanceResponse>): GameInstanceResponse => r.body)
    );
  }

  /** Path part for operation `gameInstanceConnection()` */
  static readonly GameInstanceConnectionPath = '/bff/games-services/instances/{id}/connection';

  /**
   * Connection.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `gameInstanceConnection()` instead.
   *
   * This method doesn't expect any request body.
   */
  gameInstanceConnection$Response(params: GameInstanceConnection$Params, context?: HttpContext): Observable<StrictHttpResponse<GameInstanceConnectionResponse>> {
    return gameInstanceConnection(this.http, this.rootUrl, params, context);
  }

  /**
   * Connection.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `gameInstanceConnection$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  gameInstanceConnection(params: GameInstanceConnection$Params, context?: HttpContext): Observable<GameInstanceConnectionResponse> {
    return this.gameInstanceConnection$Response(params, context).pipe(
      map((r: StrictHttpResponse<GameInstanceConnectionResponse>): GameInstanceConnectionResponse => r.body)
    );
  }

}

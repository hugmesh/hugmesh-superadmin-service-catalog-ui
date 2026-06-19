/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { NetworkSummary } from '../models/network-summary';
import { PodInspect } from '../models/pod-inspect';
import { PodMetrics } from '../models/pod-metrics';
import { PodSummary } from '../models/pod-summary';
import { VolumeSummary } from '../models/volume-summary';
import { workloadAdminCapability } from '../fn/workload-admin-controller/workload-admin-capability';
import { WorkloadAdminCapability$Params } from '../fn/workload-admin-controller/workload-admin-capability';
import { workloadAdminEvents } from '../fn/workload-admin-controller/workload-admin-events';
import { WorkloadAdminEvents$Params } from '../fn/workload-admin-controller/workload-admin-events';
import { workloadAdminInspect } from '../fn/workload-admin-controller/workload-admin-inspect';
import { WorkloadAdminInspect$Params } from '../fn/workload-admin-controller/workload-admin-inspect';
import { workloadAdminLogs } from '../fn/workload-admin-controller/workload-admin-logs';
import { WorkloadAdminLogs$Params } from '../fn/workload-admin-controller/workload-admin-logs';
import { workloadAdminMetrics } from '../fn/workload-admin-controller/workload-admin-metrics';
import { WorkloadAdminMetrics$Params } from '../fn/workload-admin-controller/workload-admin-metrics';
import { workloadAdminNetwork } from '../fn/workload-admin-controller/workload-admin-network';
import { WorkloadAdminNetwork$Params } from '../fn/workload-admin-controller/workload-admin-network';
import { workloadAdminPods } from '../fn/workload-admin-controller/workload-admin-pods';
import { WorkloadAdminPods$Params } from '../fn/workload-admin-controller/workload-admin-pods';
import { workloadAdminStorage } from '../fn/workload-admin-controller/workload-admin-storage';
import { WorkloadAdminStorage$Params } from '../fn/workload-admin-controller/workload-admin-storage';
import { WorkloadEvent } from '../models/workload-event';

@Injectable({ providedIn: 'root' })
export class WorkloadAdminControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `workloadAdminStorage()` */
  static readonly WorkloadAdminStoragePath = '/bff/admin/workloads/storage/{namespace}';

  /**
   * Storage.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `workloadAdminStorage()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadAdminStorage$Response(params: WorkloadAdminStorage$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<VolumeSummary>>> {
    return workloadAdminStorage(this.http, this.rootUrl, params, context);
  }

  /**
   * Storage.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `workloadAdminStorage$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadAdminStorage(params: WorkloadAdminStorage$Params, context?: HttpContext): Observable<Array<VolumeSummary>> {
    return this.workloadAdminStorage$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<VolumeSummary>>): Array<VolumeSummary> => r.body)
    );
  }

  /** Path part for operation `workloadAdminPods()` */
  static readonly WorkloadAdminPodsPath = '/bff/admin/workloads/pods/{namespace}';

  /**
   * Pods.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `workloadAdminPods()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadAdminPods$Response(params: WorkloadAdminPods$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<PodSummary>>> {
    return workloadAdminPods(this.http, this.rootUrl, params, context);
  }

  /**
   * Pods.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `workloadAdminPods$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadAdminPods(params: WorkloadAdminPods$Params, context?: HttpContext): Observable<Array<PodSummary>> {
    return this.workloadAdminPods$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<PodSummary>>): Array<PodSummary> => r.body)
    );
  }

  /** Path part for operation `workloadAdminInspect()` */
  static readonly WorkloadAdminInspectPath = '/bff/admin/workloads/pods/{namespace}/{name}';

  /**
   * Inspect.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `workloadAdminInspect()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadAdminInspect$Response(params: WorkloadAdminInspect$Params, context?: HttpContext): Observable<StrictHttpResponse<PodInspect>> {
    return workloadAdminInspect(this.http, this.rootUrl, params, context);
  }

  /**
   * Inspect.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `workloadAdminInspect$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadAdminInspect(params: WorkloadAdminInspect$Params, context?: HttpContext): Observable<PodInspect> {
    return this.workloadAdminInspect$Response(params, context).pipe(
      map((r: StrictHttpResponse<PodInspect>): PodInspect => r.body)
    );
  }

  /** Path part for operation `workloadAdminLogs()` */
  static readonly WorkloadAdminLogsPath = '/bff/admin/workloads/pods/{namespace}/{name}/logs';

  /**
   * Logs.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `workloadAdminLogs()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadAdminLogs$Response(params: WorkloadAdminLogs$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return workloadAdminLogs(this.http, this.rootUrl, params, context);
  }

  /**
   * Logs.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `workloadAdminLogs$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadAdminLogs(params: WorkloadAdminLogs$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.workloadAdminLogs$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `workloadAdminNetwork()` */
  static readonly WorkloadAdminNetworkPath = '/bff/admin/workloads/network/{namespace}';

  /**
   * Network.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `workloadAdminNetwork()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadAdminNetwork$Response(params: WorkloadAdminNetwork$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<NetworkSummary>>> {
    return workloadAdminNetwork(this.http, this.rootUrl, params, context);
  }

  /**
   * Network.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `workloadAdminNetwork$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadAdminNetwork(params: WorkloadAdminNetwork$Params, context?: HttpContext): Observable<Array<NetworkSummary>> {
    return this.workloadAdminNetwork$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<NetworkSummary>>): Array<NetworkSummary> => r.body)
    );
  }

  /** Path part for operation `workloadAdminMetrics()` */
  static readonly WorkloadAdminMetricsPath = '/bff/admin/workloads/metrics/{namespace}';

  /**
   * Metrics.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `workloadAdminMetrics()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadAdminMetrics$Response(params: WorkloadAdminMetrics$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<PodMetrics>>> {
    return workloadAdminMetrics(this.http, this.rootUrl, params, context);
  }

  /**
   * Metrics.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `workloadAdminMetrics$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadAdminMetrics(params: WorkloadAdminMetrics$Params, context?: HttpContext): Observable<Array<PodMetrics>> {
    return this.workloadAdminMetrics$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<PodMetrics>>): Array<PodMetrics> => r.body)
    );
  }

  /** Path part for operation `workloadAdminEvents()` */
  static readonly WorkloadAdminEventsPath = '/bff/admin/workloads/events/{namespace}';

  /**
   * Events.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `workloadAdminEvents()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadAdminEvents$Response(params: WorkloadAdminEvents$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<WorkloadEvent>>> {
    return workloadAdminEvents(this.http, this.rootUrl, params, context);
  }

  /**
   * Events.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `workloadAdminEvents$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadAdminEvents(params: WorkloadAdminEvents$Params, context?: HttpContext): Observable<Array<WorkloadEvent>> {
    return this.workloadAdminEvents$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<WorkloadEvent>>): Array<WorkloadEvent> => r.body)
    );
  }

  /** Path part for operation `workloadAdminCapability()` */
  static readonly WorkloadAdminCapabilityPath = '/bff/admin/workloads/capability';

  /**
   * Capability.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `workloadAdminCapability()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadAdminCapability$Response(params?: WorkloadAdminCapability$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return workloadAdminCapability(this.http, this.rootUrl, params, context);
  }

  /**
   * Capability.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `workloadAdminCapability$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadAdminCapability(params?: WorkloadAdminCapability$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.workloadAdminCapability$Response(params, context).pipe(
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

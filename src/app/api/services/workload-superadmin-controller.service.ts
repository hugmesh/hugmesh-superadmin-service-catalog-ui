/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { ExecResult } from '../models/exec-result';
import { PodSummary } from '../models/pod-summary';
import { ServerSentEventLogLine } from '../models/server-sent-event-log-line';
import { WorkloadConsoleConfig } from '../models/workload-console-config';
import { WorkloadConsoleGrant } from '../models/workload-console-grant';
import { WorkloadConsoleIntent } from '../models/workload-console-intent';
import { workloadSuperadminAllPods } from '../fn/workload-superadmin-controller/workload-superadmin-all-pods';
import { WorkloadSuperadminAllPods$Params } from '../fn/workload-superadmin-controller/workload-superadmin-all-pods';
import { workloadSuperadminDeletePod } from '../fn/workload-superadmin-controller/workload-superadmin-delete-pod';
import { WorkloadSuperadminDeletePod$Params } from '../fn/workload-superadmin-controller/workload-superadmin-delete-pod';
import { workloadSuperadminExecReadOnly } from '../fn/workload-superadmin-controller/workload-superadmin-exec-read-only';
import { WorkloadSuperadminExecReadOnly$Params } from '../fn/workload-superadmin-controller/workload-superadmin-exec-read-only';
import { workloadSuperadminGrant } from '../fn/workload-superadmin-controller/workload-superadmin-grant';
import { WorkloadSuperadminGrant$Params } from '../fn/workload-superadmin-controller/workload-superadmin-grant';
import { workloadSuperadminLifecycle } from '../fn/workload-superadmin-controller/workload-superadmin-lifecycle';
import { WorkloadSuperadminLifecycle$Params } from '../fn/workload-superadmin-controller/workload-superadmin-lifecycle';
import { workloadSuperadminListConfig } from '../fn/workload-superadmin-controller/workload-superadmin-list-config';
import { WorkloadSuperadminListConfig$Params } from '../fn/workload-superadmin-controller/workload-superadmin-list-config';
import { workloadSuperadminListGrants } from '../fn/workload-superadmin-controller/workload-superadmin-list-grants';
import { WorkloadSuperadminListGrants$Params } from '../fn/workload-superadmin-controller/workload-superadmin-list-grants';
import { workloadSuperadminPendingIntents } from '../fn/workload-superadmin-controller/workload-superadmin-pending-intents';
import { WorkloadSuperadminPendingIntents$Params } from '../fn/workload-superadmin-controller/workload-superadmin-pending-intents';
import { workloadSuperadminPortForward } from '../fn/workload-superadmin-controller/workload-superadmin-port-forward';
import { WorkloadSuperadminPortForward$Params } from '../fn/workload-superadmin-controller/workload-superadmin-port-forward';
import { workloadSuperadminPutConfig } from '../fn/workload-superadmin-controller/workload-superadmin-put-config';
import { WorkloadSuperadminPutConfig$Params } from '../fn/workload-superadmin-controller/workload-superadmin-put-config';
import { workloadSuperadminRevokeGrant } from '../fn/workload-superadmin-controller/workload-superadmin-revoke-grant';
import { WorkloadSuperadminRevokeGrant$Params } from '../fn/workload-superadmin-controller/workload-superadmin-revoke-grant';
import { workloadSuperadminRolloutRestart } from '../fn/workload-superadmin-controller/workload-superadmin-rollout-restart';
import { WorkloadSuperadminRolloutRestart$Params } from '../fn/workload-superadmin-controller/workload-superadmin-rollout-restart';
import { workloadSuperadminStepUp } from '../fn/workload-superadmin-controller/workload-superadmin-step-up';
import { WorkloadSuperadminStepUp$Params } from '../fn/workload-superadmin-controller/workload-superadmin-step-up';
import { workloadSuperadminTextEventStreamValue } from '../fn/workload-superadmin-controller/workload-superadmin-text-event-stream-value';
import { WorkloadSuperadminTextEventStreamValue$Params } from '../fn/workload-superadmin-controller/workload-superadmin-text-event-stream-value';

@Injectable({ providedIn: 'root' })
export class WorkloadSuperadminControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `workloadSuperadminPutConfig()` */
  static readonly WorkloadSuperadminPutConfigPath = '/bff/superadmin/workloads/config/{domain}';

  /**
   * Put config.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `workloadSuperadminPutConfig()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  workloadSuperadminPutConfig$Response(params: WorkloadSuperadminPutConfig$Params, context?: HttpContext): Observable<StrictHttpResponse<WorkloadConsoleConfig>> {
    return workloadSuperadminPutConfig(this.http, this.rootUrl, params, context);
  }

  /**
   * Put config.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `workloadSuperadminPutConfig$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  workloadSuperadminPutConfig(params: WorkloadSuperadminPutConfig$Params, context?: HttpContext): Observable<WorkloadConsoleConfig> {
    return this.workloadSuperadminPutConfig$Response(params, context).pipe(
      map((r: StrictHttpResponse<WorkloadConsoleConfig>): WorkloadConsoleConfig => r.body)
    );
  }

  /** Path part for operation `workloadSuperadminStepUp()` */
  static readonly WorkloadSuperadminStepUpPath = '/bff/superadmin/workloads/step-up';

  /**
   * Step up.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `workloadSuperadminStepUp()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadSuperadminStepUp$Response(params?: WorkloadSuperadminStepUp$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return workloadSuperadminStepUp(this.http, this.rootUrl, params, context);
  }

  /**
   * Step up.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `workloadSuperadminStepUp$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadSuperadminStepUp(params?: WorkloadSuperadminStepUp$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.workloadSuperadminStepUp$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `workloadSuperadminPortForward()` */
  static readonly WorkloadSuperadminPortForwardPath = '/bff/superadmin/workloads/port-forward/{namespace}/{workload}';

  /**
   * Port forward.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `workloadSuperadminPortForward()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadSuperadminPortForward$Response(params: WorkloadSuperadminPortForward$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return workloadSuperadminPortForward(this.http, this.rootUrl, params, context);
  }

  /**
   * Port forward.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `workloadSuperadminPortForward$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadSuperadminPortForward(params: WorkloadSuperadminPortForward$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.workloadSuperadminPortForward$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `workloadSuperadminRolloutRestart()` */
  static readonly WorkloadSuperadminRolloutRestartPath = '/bff/superadmin/workloads/pods/{namespace}/{workload}/rollout-restart';

  /**
   * Rollout restart.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `workloadSuperadminRolloutRestart()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadSuperadminRolloutRestart$Response(params: WorkloadSuperadminRolloutRestart$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return workloadSuperadminRolloutRestart(this.http, this.rootUrl, params, context);
  }

  /**
   * Rollout restart.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `workloadSuperadminRolloutRestart$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadSuperadminRolloutRestart(params: WorkloadSuperadminRolloutRestart$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.workloadSuperadminRolloutRestart$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `workloadSuperadminLifecycle()` */
  static readonly WorkloadSuperadminLifecyclePath = '/bff/superadmin/workloads/lifecycle/{namespace}/{workload}/{verb}';

  /**
   * Lifecycle.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `workloadSuperadminLifecycle()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  workloadSuperadminLifecycle$Response(params: WorkloadSuperadminLifecycle$Params, context?: HttpContext): Observable<StrictHttpResponse<WorkloadConsoleIntent>> {
    return workloadSuperadminLifecycle(this.http, this.rootUrl, params, context);
  }

  /**
   * Lifecycle.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `workloadSuperadminLifecycle$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  workloadSuperadminLifecycle(params: WorkloadSuperadminLifecycle$Params, context?: HttpContext): Observable<WorkloadConsoleIntent> {
    return this.workloadSuperadminLifecycle$Response(params, context).pipe(
      map((r: StrictHttpResponse<WorkloadConsoleIntent>): WorkloadConsoleIntent => r.body)
    );
  }

  /** Path part for operation `workloadSuperadminListGrants()` */
  static readonly WorkloadSuperadminListGrantsPath = '/bff/superadmin/workloads/grants';

  /**
   * List grants.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `workloadSuperadminListGrants()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadSuperadminListGrants$Response(params?: WorkloadSuperadminListGrants$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<WorkloadConsoleGrant>>> {
    return workloadSuperadminListGrants(this.http, this.rootUrl, params, context);
  }

  /**
   * List grants.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `workloadSuperadminListGrants$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadSuperadminListGrants(params?: WorkloadSuperadminListGrants$Params, context?: HttpContext): Observable<Array<WorkloadConsoleGrant>> {
    return this.workloadSuperadminListGrants$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<WorkloadConsoleGrant>>): Array<WorkloadConsoleGrant> => r.body)
    );
  }

  /** Path part for operation `workloadSuperadminGrant()` */
  static readonly WorkloadSuperadminGrantPath = '/bff/superadmin/workloads/grants';

  /**
   * Grant.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `workloadSuperadminGrant()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  workloadSuperadminGrant$Response(params: WorkloadSuperadminGrant$Params, context?: HttpContext): Observable<StrictHttpResponse<WorkloadConsoleGrant>> {
    return workloadSuperadminGrant(this.http, this.rootUrl, params, context);
  }

  /**
   * Grant.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `workloadSuperadminGrant$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  workloadSuperadminGrant(params: WorkloadSuperadminGrant$Params, context?: HttpContext): Observable<WorkloadConsoleGrant> {
    return this.workloadSuperadminGrant$Response(params, context).pipe(
      map((r: StrictHttpResponse<WorkloadConsoleGrant>): WorkloadConsoleGrant => r.body)
    );
  }

  /** Path part for operation `workloadSuperadminExecReadOnly()` */
  static readonly WorkloadSuperadminExecReadOnlyPath = '/bff/superadmin/workloads/exec/{namespace}/{pod}';

  /**
   * Exec read only.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `workloadSuperadminExecReadOnly()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  workloadSuperadminExecReadOnly$Response(params: WorkloadSuperadminExecReadOnly$Params, context?: HttpContext): Observable<StrictHttpResponse<ExecResult>> {
    return workloadSuperadminExecReadOnly(this.http, this.rootUrl, params, context);
  }

  /**
   * Exec read only.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `workloadSuperadminExecReadOnly$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  workloadSuperadminExecReadOnly(params: WorkloadSuperadminExecReadOnly$Params, context?: HttpContext): Observable<ExecResult> {
    return this.workloadSuperadminExecReadOnly$Response(params, context).pipe(
      map((r: StrictHttpResponse<ExecResult>): ExecResult => r.body)
    );
  }

  /** Path part for operation `workloadSuperadminAllPods()` */
  static readonly WorkloadSuperadminAllPodsPath = '/bff/superadmin/workloads/pods';

  /**
   * All pods.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `workloadSuperadminAllPods()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadSuperadminAllPods$Response(params?: WorkloadSuperadminAllPods$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<PodSummary>>> {
    return workloadSuperadminAllPods(this.http, this.rootUrl, params, context);
  }

  /**
   * All pods.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `workloadSuperadminAllPods$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadSuperadminAllPods(params?: WorkloadSuperadminAllPods$Params, context?: HttpContext): Observable<Array<PodSummary>> {
    return this.workloadSuperadminAllPods$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<PodSummary>>): Array<PodSummary> => r.body)
    );
  }

  /** Path part for operation `workloadSuperadminTextEventStreamValue()` */
  static readonly WorkloadSuperadminTextEventStreamValuePath = '/bff/superadmin/workloads/pods/{namespace}/{pod}/logs/stream';

  /**
   * Text_event_stream_value.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `workloadSuperadminTextEventStreamValue()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadSuperadminTextEventStreamValue$Response(params: WorkloadSuperadminTextEventStreamValue$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<ServerSentEventLogLine>>> {
    return workloadSuperadminTextEventStreamValue(this.http, this.rootUrl, params, context);
  }

  /**
   * Text_event_stream_value.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `workloadSuperadminTextEventStreamValue$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadSuperadminTextEventStreamValue(params: WorkloadSuperadminTextEventStreamValue$Params, context?: HttpContext): Observable<Array<ServerSentEventLogLine>> {
    return this.workloadSuperadminTextEventStreamValue$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<ServerSentEventLogLine>>): Array<ServerSentEventLogLine> => r.body)
    );
  }

  /** Path part for operation `workloadSuperadminPendingIntents()` */
  static readonly WorkloadSuperadminPendingIntentsPath = '/bff/superadmin/workloads/lifecycle/pending';

  /**
   * Pending intents.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `workloadSuperadminPendingIntents()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadSuperadminPendingIntents$Response(params?: WorkloadSuperadminPendingIntents$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<WorkloadConsoleIntent>>> {
    return workloadSuperadminPendingIntents(this.http, this.rootUrl, params, context);
  }

  /**
   * Pending intents.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `workloadSuperadminPendingIntents$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadSuperadminPendingIntents(params?: WorkloadSuperadminPendingIntents$Params, context?: HttpContext): Observable<Array<WorkloadConsoleIntent>> {
    return this.workloadSuperadminPendingIntents$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<WorkloadConsoleIntent>>): Array<WorkloadConsoleIntent> => r.body)
    );
  }

  /** Path part for operation `workloadSuperadminListConfig()` */
  static readonly WorkloadSuperadminListConfigPath = '/bff/superadmin/workloads/config';

  /**
   * List config.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `workloadSuperadminListConfig()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadSuperadminListConfig$Response(params?: WorkloadSuperadminListConfig$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<WorkloadConsoleConfig>>> {
    return workloadSuperadminListConfig(this.http, this.rootUrl, params, context);
  }

  /**
   * List config.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `workloadSuperadminListConfig$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadSuperadminListConfig(params?: WorkloadSuperadminListConfig$Params, context?: HttpContext): Observable<Array<WorkloadConsoleConfig>> {
    return this.workloadSuperadminListConfig$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<WorkloadConsoleConfig>>): Array<WorkloadConsoleConfig> => r.body)
    );
  }

  /** Path part for operation `workloadSuperadminDeletePod()` */
  static readonly WorkloadSuperadminDeletePodPath = '/bff/superadmin/workloads/pods/{namespace}/{pod}';

  /**
   * Delete pod.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `workloadSuperadminDeletePod()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadSuperadminDeletePod$Response(params: WorkloadSuperadminDeletePod$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return workloadSuperadminDeletePod(this.http, this.rootUrl, params, context);
  }

  /**
   * Delete pod.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `workloadSuperadminDeletePod$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadSuperadminDeletePod(params: WorkloadSuperadminDeletePod$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.workloadSuperadminDeletePod$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `workloadSuperadminRevokeGrant()` */
  static readonly WorkloadSuperadminRevokeGrantPath = '/bff/superadmin/workloads/grants/{id}';

  /**
   * Revoke grant.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `workloadSuperadminRevokeGrant()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadSuperadminRevokeGrant$Response(params: WorkloadSuperadminRevokeGrant$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return workloadSuperadminRevokeGrant(this.http, this.rootUrl, params, context);
  }

  /**
   * Revoke grant.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `workloadSuperadminRevokeGrant$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  workloadSuperadminRevokeGrant(params: WorkloadSuperadminRevokeGrant$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.workloadSuperadminRevokeGrant$Response(params, context).pipe(
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

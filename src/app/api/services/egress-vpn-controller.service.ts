/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { egressVpnAssignDomain } from '../fn/egress-vpn-controller/egress-vpn-assign-domain';
import { EgressVpnAssignDomain$Params } from '../fn/egress-vpn-controller/egress-vpn-assign-domain';
import { egressVpnAssignNode } from '../fn/egress-vpn-controller/egress-vpn-assign-node';
import { EgressVpnAssignNode$Params } from '../fn/egress-vpn-controller/egress-vpn-assign-node';
import { egressVpnExport } from '../fn/egress-vpn-controller/egress-vpn-export';
import { EgressVpnExport$Params } from '../fn/egress-vpn-controller/egress-vpn-export';
import { egressVpnImportConfig } from '../fn/egress-vpn-controller/egress-vpn-import-config';
import { EgressVpnImportConfig$Params } from '../fn/egress-vpn-controller/egress-vpn-import-config';
import { egressVpnList } from '../fn/egress-vpn-controller/egress-vpn-list';
import { EgressVpnList$Params } from '../fn/egress-vpn-controller/egress-vpn-list';
import { egressVpnRevokeAssignment } from '../fn/egress-vpn-controller/egress-vpn-revoke-assignment';
import { EgressVpnRevokeAssignment$Params } from '../fn/egress-vpn-controller/egress-vpn-revoke-assignment';
import { egressVpnRevokeConfig } from '../fn/egress-vpn-controller/egress-vpn-revoke-config';
import { EgressVpnRevokeConfig$Params } from '../fn/egress-vpn-controller/egress-vpn-revoke-config';
import { SignedVpnExport } from '../models/signed-vpn-export';
import { VpnConfig } from '../models/vpn-config';
import { VpnNodeAssignment } from '../models/vpn-node-assignment';

@Injectable({ providedIn: 'root' })
export class EgressVpnControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `egressVpnImportConfig()` */
  static readonly EgressVpnImportConfigPath = '/bff/admin/egress-vpn/configs';

  /**
   * Import config.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `egressVpnImportConfig()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  egressVpnImportConfig$Response(params: EgressVpnImportConfig$Params, context?: HttpContext): Observable<StrictHttpResponse<VpnConfig>> {
    return egressVpnImportConfig(this.http, this.rootUrl, params, context);
  }

  /**
   * Import config.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `egressVpnImportConfig$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  egressVpnImportConfig(params: EgressVpnImportConfig$Params, context?: HttpContext): Observable<VpnConfig> {
    return this.egressVpnImportConfig$Response(params, context).pipe(
      map((r: StrictHttpResponse<VpnConfig>): VpnConfig => r.body)
    );
  }

  /** Path part for operation `egressVpnAssignNode()` */
  static readonly EgressVpnAssignNodePath = '/bff/admin/egress-vpn/configs/{configId}/assign/node/{nodeFp}';

  /**
   * Assign node.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `egressVpnAssignNode()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  egressVpnAssignNode$Response(params: EgressVpnAssignNode$Params, context?: HttpContext): Observable<StrictHttpResponse<VpnNodeAssignment>> {
    return egressVpnAssignNode(this.http, this.rootUrl, params, context);
  }

  /**
   * Assign node.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `egressVpnAssignNode$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  egressVpnAssignNode(params: EgressVpnAssignNode$Params, context?: HttpContext): Observable<VpnNodeAssignment> {
    return this.egressVpnAssignNode$Response(params, context).pipe(
      map((r: StrictHttpResponse<VpnNodeAssignment>): VpnNodeAssignment => r.body)
    );
  }

  /** Path part for operation `egressVpnAssignDomain()` */
  static readonly EgressVpnAssignDomainPath = '/bff/admin/egress-vpn/configs/{configId}/assign/domain/{domain}';

  /**
   * Assign domain.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `egressVpnAssignDomain()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  egressVpnAssignDomain$Response(params: EgressVpnAssignDomain$Params, context?: HttpContext): Observable<StrictHttpResponse<VpnNodeAssignment>> {
    return egressVpnAssignDomain(this.http, this.rootUrl, params, context);
  }

  /**
   * Assign domain.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `egressVpnAssignDomain$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  egressVpnAssignDomain(params: EgressVpnAssignDomain$Params, context?: HttpContext): Observable<VpnNodeAssignment> {
    return this.egressVpnAssignDomain$Response(params, context).pipe(
      map((r: StrictHttpResponse<VpnNodeAssignment>): VpnNodeAssignment => r.body)
    );
  }

  /** Path part for operation `egressVpnList()` */
  static readonly EgressVpnListPath = '/bff/admin/egress-vpn';

  /**
   * List.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `egressVpnList()` instead.
   *
   * This method doesn't expect any request body.
   */
  egressVpnList$Response(params?: EgressVpnList$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return egressVpnList(this.http, this.rootUrl, params, context);
  }

  /**
   * List.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `egressVpnList$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  egressVpnList(params?: EgressVpnList$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.egressVpnList$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `egressVpnExport()` */
  static readonly EgressVpnExportPath = '/bff/admin/egress-vpn/export';

  /**
   * Export.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `egressVpnExport()` instead.
   *
   * This method doesn't expect any request body.
   */
  egressVpnExport$Response(params: EgressVpnExport$Params, context?: HttpContext): Observable<StrictHttpResponse<SignedVpnExport>> {
    return egressVpnExport(this.http, this.rootUrl, params, context);
  }

  /**
   * Export.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `egressVpnExport$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  egressVpnExport(params: EgressVpnExport$Params, context?: HttpContext): Observable<SignedVpnExport> {
    return this.egressVpnExport$Response(params, context).pipe(
      map((r: StrictHttpResponse<SignedVpnExport>): SignedVpnExport => r.body)
    );
  }

  /** Path part for operation `egressVpnRevokeConfig()` */
  static readonly EgressVpnRevokeConfigPath = '/bff/admin/egress-vpn/configs/{configId}';

  /**
   * Revoke config.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `egressVpnRevokeConfig()` instead.
   *
   * This method doesn't expect any request body.
   */
  egressVpnRevokeConfig$Response(params: EgressVpnRevokeConfig$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return egressVpnRevokeConfig(this.http, this.rootUrl, params, context);
  }

  /**
   * Revoke config.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `egressVpnRevokeConfig$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  egressVpnRevokeConfig(params: EgressVpnRevokeConfig$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.egressVpnRevokeConfig$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `egressVpnRevokeAssignment()` */
  static readonly EgressVpnRevokeAssignmentPath = '/bff/admin/egress-vpn/assignments/{assignmentId}';

  /**
   * Revoke assignment.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `egressVpnRevokeAssignment()` instead.
   *
   * This method doesn't expect any request body.
   */
  egressVpnRevokeAssignment$Response(params: EgressVpnRevokeAssignment$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return egressVpnRevokeAssignment(this.http, this.rootUrl, params, context);
  }

  /**
   * Revoke assignment.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `egressVpnRevokeAssignment$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  egressVpnRevokeAssignment(params: EgressVpnRevokeAssignment$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.egressVpnRevokeAssignment$Response(params, context).pipe(
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

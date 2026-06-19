/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { adminSshKeyIssuanceIssue } from '../fn/admin-ssh-key-issuance-controller/admin-ssh-key-issuance-issue';
import { AdminSshKeyIssuanceIssue$Params } from '../fn/admin-ssh-key-issuance-controller/admin-ssh-key-issuance-issue';
import { adminSshKeyIssuanceListForDevice } from '../fn/admin-ssh-key-issuance-controller/admin-ssh-key-issuance-list-for-device';
import { AdminSshKeyIssuanceListForDevice$Params } from '../fn/admin-ssh-key-issuance-controller/admin-ssh-key-issuance-list-for-device';
import { adminSshKeyIssuancePrivateKey } from '../fn/admin-ssh-key-issuance-controller/admin-ssh-key-issuance-private-key';
import { AdminSshKeyIssuancePrivateKey$Params } from '../fn/admin-ssh-key-issuance-controller/admin-ssh-key-issuance-private-key';
import { adminSshKeyIssuanceRevoke } from '../fn/admin-ssh-key-issuance-controller/admin-ssh-key-issuance-revoke';
import { AdminSshKeyIssuanceRevoke$Params } from '../fn/admin-ssh-key-issuance-controller/admin-ssh-key-issuance-revoke';
import { DataBuffer } from '../models/data-buffer';

@Injectable({ providedIn: 'root' })
export class AdminSshKeyIssuanceControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `adminSshKeyIssuanceIssue()` */
  static readonly AdminSshKeyIssuanceIssuePath = '/bff/admin/ssh-issue/issue';

  /**
   * Issue.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `adminSshKeyIssuanceIssue()` instead.
   *
   * This method doesn't expect any request body.
   */
  adminSshKeyIssuanceIssue$Response(params: AdminSshKeyIssuanceIssue$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return adminSshKeyIssuanceIssue(this.http, this.rootUrl, params, context);
  }

  /**
   * Issue.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `adminSshKeyIssuanceIssue$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  adminSshKeyIssuanceIssue(params: AdminSshKeyIssuanceIssue$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.adminSshKeyIssuanceIssue$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `adminSshKeyIssuancePrivateKey()` */
  static readonly AdminSshKeyIssuancePrivateKeyPath = '/bff/admin/ssh-issue/issued/{id}/private-key';

  /**
   * Private key.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `adminSshKeyIssuancePrivateKey()` instead.
   *
   * This method doesn't expect any request body.
   */
  adminSshKeyIssuancePrivateKey$Response(params: AdminSshKeyIssuancePrivateKey$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<DataBuffer>>> {
    return adminSshKeyIssuancePrivateKey(this.http, this.rootUrl, params, context);
  }

  /**
   * Private key.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `adminSshKeyIssuancePrivateKey$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  adminSshKeyIssuancePrivateKey(params: AdminSshKeyIssuancePrivateKey$Params, context?: HttpContext): Observable<Array<DataBuffer>> {
    return this.adminSshKeyIssuancePrivateKey$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<DataBuffer>>): Array<DataBuffer> => r.body)
    );
  }

  /** Path part for operation `adminSshKeyIssuanceListForDevice()` */
  static readonly AdminSshKeyIssuanceListForDevicePath = '/bff/admin/ssh-issue/devices/{deviceId}/issued-keys';

  /**
   * List for device.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `adminSshKeyIssuanceListForDevice()` instead.
   *
   * This method doesn't expect any request body.
   */
  adminSshKeyIssuanceListForDevice$Response(params: AdminSshKeyIssuanceListForDevice$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return adminSshKeyIssuanceListForDevice(this.http, this.rootUrl, params, context);
  }

  /**
   * List for device.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `adminSshKeyIssuanceListForDevice$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  adminSshKeyIssuanceListForDevice(params: AdminSshKeyIssuanceListForDevice$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.adminSshKeyIssuanceListForDevice$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `adminSshKeyIssuanceRevoke()` */
  static readonly AdminSshKeyIssuanceRevokePath = '/bff/admin/ssh-issue/issued/{id}';

  /**
   * Revoke.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `adminSshKeyIssuanceRevoke()` instead.
   *
   * This method doesn't expect any request body.
   */
  adminSshKeyIssuanceRevoke$Response(params: AdminSshKeyIssuanceRevoke$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return adminSshKeyIssuanceRevoke(this.http, this.rootUrl, params, context);
  }

  /**
   * Revoke.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `adminSshKeyIssuanceRevoke$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  adminSshKeyIssuanceRevoke(params: AdminSshKeyIssuanceRevoke$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.adminSshKeyIssuanceRevoke$Response(params, context).pipe(
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

/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { ServiceAssignment } from '../models/service-assignment';
import { SignedStorageExport } from '../models/signed-storage-export';
import { StoragePool } from '../models/storage-pool';
import { storagePoolAssign } from '../fn/storage-pool-controller/storage-pool-assign';
import { StoragePoolAssign$Params } from '../fn/storage-pool-controller/storage-pool-assign';
import { storagePoolAttach } from '../fn/storage-pool-controller/storage-pool-attach';
import { StoragePoolAttach$Params } from '../fn/storage-pool-controller/storage-pool-attach';
import { storagePoolDetach } from '../fn/storage-pool-controller/storage-pool-detach';
import { StoragePoolDetach$Params } from '../fn/storage-pool-controller/storage-pool-detach';
import { storagePoolExport } from '../fn/storage-pool-controller/storage-pool-export';
import { StoragePoolExport$Params } from '../fn/storage-pool-controller/storage-pool-export';
import { storagePoolList } from '../fn/storage-pool-controller/storage-pool-list';
import { StoragePoolList$Params } from '../fn/storage-pool-controller/storage-pool-list';
import { storagePoolRevoke } from '../fn/storage-pool-controller/storage-pool-revoke';
import { StoragePoolRevoke$Params } from '../fn/storage-pool-controller/storage-pool-revoke';

@Injectable({ providedIn: 'root' })
export class StoragePoolControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `storagePoolAttach()` */
  static readonly StoragePoolAttachPath = '/bff/admin/device-storage-pools/{deviceId}/pools';

  /**
   * Attach.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `storagePoolAttach()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  storagePoolAttach$Response(params: StoragePoolAttach$Params, context?: HttpContext): Observable<StrictHttpResponse<StoragePool>> {
    return storagePoolAttach(this.http, this.rootUrl, params, context);
  }

  /**
   * Attach.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `storagePoolAttach$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  storagePoolAttach(params: StoragePoolAttach$Params, context?: HttpContext): Observable<StoragePool> {
    return this.storagePoolAttach$Response(params, context).pipe(
      map((r: StrictHttpResponse<StoragePool>): StoragePool => r.body)
    );
  }

  /** Path part for operation `storagePoolAssign()` */
  static readonly StoragePoolAssignPath = '/bff/admin/device-storage-pools/pools/{poolId}/assignments';

  /**
   * Assign.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `storagePoolAssign()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  storagePoolAssign$Response(params: StoragePoolAssign$Params, context?: HttpContext): Observable<StrictHttpResponse<ServiceAssignment>> {
    return storagePoolAssign(this.http, this.rootUrl, params, context);
  }

  /**
   * Assign.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `storagePoolAssign$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  storagePoolAssign(params: StoragePoolAssign$Params, context?: HttpContext): Observable<ServiceAssignment> {
    return this.storagePoolAssign$Response(params, context).pipe(
      map((r: StrictHttpResponse<ServiceAssignment>): ServiceAssignment => r.body)
    );
  }

  /** Path part for operation `storagePoolList()` */
  static readonly StoragePoolListPath = '/bff/admin/device-storage-pools';

  /**
   * List.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `storagePoolList()` instead.
   *
   * This method doesn't expect any request body.
   */
  storagePoolList$Response(params?: StoragePoolList$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return storagePoolList(this.http, this.rootUrl, params, context);
  }

  /**
   * List.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `storagePoolList$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  storagePoolList(params?: StoragePoolList$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.storagePoolList$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `storagePoolExport()` */
  static readonly StoragePoolExportPath = '/bff/admin/device-storage-pools/export';

  /**
   * Export.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `storagePoolExport()` instead.
   *
   * This method doesn't expect any request body.
   */
  storagePoolExport$Response(params?: StoragePoolExport$Params, context?: HttpContext): Observable<StrictHttpResponse<SignedStorageExport>> {
    return storagePoolExport(this.http, this.rootUrl, params, context);
  }

  /**
   * Export.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `storagePoolExport$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  storagePoolExport(params?: StoragePoolExport$Params, context?: HttpContext): Observable<SignedStorageExport> {
    return this.storagePoolExport$Response(params, context).pipe(
      map((r: StrictHttpResponse<SignedStorageExport>): SignedStorageExport => r.body)
    );
  }

  /** Path part for operation `storagePoolDetach()` */
  static readonly StoragePoolDetachPath = '/bff/admin/device-storage-pools/pools/{poolId}';

  /**
   * Detach.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `storagePoolDetach()` instead.
   *
   * This method doesn't expect any request body.
   */
  storagePoolDetach$Response(params: StoragePoolDetach$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return storagePoolDetach(this.http, this.rootUrl, params, context);
  }

  /**
   * Detach.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `storagePoolDetach$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  storagePoolDetach(params: StoragePoolDetach$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.storagePoolDetach$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `storagePoolRevoke()` */
  static readonly StoragePoolRevokePath = '/bff/admin/device-storage-pools/assignments/{assignmentId}';

  /**
   * Revoke.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `storagePoolRevoke()` instead.
   *
   * This method doesn't expect any request body.
   */
  storagePoolRevoke$Response(params: StoragePoolRevoke$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return storagePoolRevoke(this.http, this.rootUrl, params, context);
  }

  /**
   * Revoke.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `storagePoolRevoke$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  storagePoolRevoke(params: StoragePoolRevoke$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.storagePoolRevoke$Response(params, context).pipe(
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

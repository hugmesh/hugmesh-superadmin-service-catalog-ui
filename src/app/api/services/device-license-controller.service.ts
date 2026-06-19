/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { Device } from '../models/device';
import { deviceLicenseDeregister } from '../fn/device-license-controller/device-license-deregister';
import { DeviceLicenseDeregister$Params } from '../fn/device-license-controller/device-license-deregister';
import { deviceLicenseExport } from '../fn/device-license-controller/device-license-export';
import { DeviceLicenseExport$Params } from '../fn/device-license-controller/device-license-export';
import { deviceLicenseGrantDevice } from '../fn/device-license-controller/device-license-grant-device';
import { DeviceLicenseGrantDevice$Params } from '../fn/device-license-controller/device-license-grant-device';
import { deviceLicenseGrantDomain } from '../fn/device-license-controller/device-license-grant-domain';
import { DeviceLicenseGrantDomain$Params } from '../fn/device-license-controller/device-license-grant-domain';
import { deviceLicenseList } from '../fn/device-license-controller/device-license-list';
import { DeviceLicenseList$Params } from '../fn/device-license-controller/device-license-list';
import { deviceLicensePending } from '../fn/device-license-controller/device-license-pending';
import { DeviceLicensePending$Params } from '../fn/device-license-controller/device-license-pending';
import { deviceLicenseRegister } from '../fn/device-license-controller/device-license-register';
import { DeviceLicenseRegister$Params } from '../fn/device-license-controller/device-license-register';
import { deviceLicenseRevoke } from '../fn/device-license-controller/device-license-revoke';
import { DeviceLicenseRevoke$Params } from '../fn/device-license-controller/device-license-revoke';
import { SignedExport } from '../models/signed-export';
import { SshLicense } from '../models/ssh-license';

@Injectable({ providedIn: 'root' })
export class DeviceLicenseControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `deviceLicenseGrantDevice()` */
  static readonly DeviceLicenseGrantDevicePath = '/bff/admin/device-licenses/{deviceId}/grant';

  /**
   * Grant device.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `deviceLicenseGrantDevice()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  deviceLicenseGrantDevice$Response(params: DeviceLicenseGrantDevice$Params, context?: HttpContext): Observable<StrictHttpResponse<SshLicense>> {
    return deviceLicenseGrantDevice(this.http, this.rootUrl, params, context);
  }

  /**
   * Grant device.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `deviceLicenseGrantDevice$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  deviceLicenseGrantDevice(params: DeviceLicenseGrantDevice$Params, context?: HttpContext): Observable<SshLicense> {
    return this.deviceLicenseGrantDevice$Response(params, context).pipe(
      map((r: StrictHttpResponse<SshLicense>): SshLicense => r.body)
    );
  }

  /** Path part for operation `deviceLicenseRegister()` */
  static readonly DeviceLicenseRegisterPath = '/bff/admin/device-licenses/register';

  /**
   * Register.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `deviceLicenseRegister()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  deviceLicenseRegister$Response(params: DeviceLicenseRegister$Params, context?: HttpContext): Observable<StrictHttpResponse<Device>> {
    return deviceLicenseRegister(this.http, this.rootUrl, params, context);
  }

  /**
   * Register.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `deviceLicenseRegister$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  deviceLicenseRegister(params: DeviceLicenseRegister$Params, context?: HttpContext): Observable<Device> {
    return this.deviceLicenseRegister$Response(params, context).pipe(
      map((r: StrictHttpResponse<Device>): Device => r.body)
    );
  }

  /** Path part for operation `deviceLicenseGrantDomain()` */
  static readonly DeviceLicenseGrantDomainPath = '/bff/admin/device-licenses/domains/{domain}/grant';

  /**
   * Grant domain.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `deviceLicenseGrantDomain()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  deviceLicenseGrantDomain$Response(params: DeviceLicenseGrantDomain$Params, context?: HttpContext): Observable<StrictHttpResponse<SshLicense>> {
    return deviceLicenseGrantDomain(this.http, this.rootUrl, params, context);
  }

  /**
   * Grant domain.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `deviceLicenseGrantDomain$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  deviceLicenseGrantDomain(params: DeviceLicenseGrantDomain$Params, context?: HttpContext): Observable<SshLicense> {
    return this.deviceLicenseGrantDomain$Response(params, context).pipe(
      map((r: StrictHttpResponse<SshLicense>): SshLicense => r.body)
    );
  }

  /** Path part for operation `deviceLicenseList()` */
  static readonly DeviceLicenseListPath = '/bff/admin/device-licenses';

  /**
   * List.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `deviceLicenseList()` instead.
   *
   * This method doesn't expect any request body.
   */
  deviceLicenseList$Response(params?: DeviceLicenseList$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return deviceLicenseList(this.http, this.rootUrl, params, context);
  }

  /**
   * List.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `deviceLicenseList$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  deviceLicenseList(params?: DeviceLicenseList$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.deviceLicenseList$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `deviceLicensePending()` */
  static readonly DeviceLicensePendingPath = '/bff/admin/device-licenses/pending';

  /**
   * Pending.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `deviceLicensePending()` instead.
   *
   * This method doesn't expect any request body.
   */
  deviceLicensePending$Response(params?: DeviceLicensePending$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return deviceLicensePending(this.http, this.rootUrl, params, context);
  }

  /**
   * Pending.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `deviceLicensePending$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  deviceLicensePending(params?: DeviceLicensePending$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.deviceLicensePending$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `deviceLicenseExport()` */
  static readonly DeviceLicenseExportPath = '/bff/admin/device-licenses/export';

  /**
   * Export.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `deviceLicenseExport()` instead.
   *
   * This method doesn't expect any request body.
   */
  deviceLicenseExport$Response(params?: DeviceLicenseExport$Params, context?: HttpContext): Observable<StrictHttpResponse<SignedExport>> {
    return deviceLicenseExport(this.http, this.rootUrl, params, context);
  }

  /**
   * Export.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `deviceLicenseExport$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  deviceLicenseExport(params?: DeviceLicenseExport$Params, context?: HttpContext): Observable<SignedExport> {
    return this.deviceLicenseExport$Response(params, context).pipe(
      map((r: StrictHttpResponse<SignedExport>): SignedExport => r.body)
    );
  }

  /** Path part for operation `deviceLicenseDeregister()` */
  static readonly DeviceLicenseDeregisterPath = '/bff/admin/device-licenses/{deviceId}';

  /**
   * Deregister.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `deviceLicenseDeregister()` instead.
   *
   * This method doesn't expect any request body.
   */
  deviceLicenseDeregister$Response(params: DeviceLicenseDeregister$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return deviceLicenseDeregister(this.http, this.rootUrl, params, context);
  }

  /**
   * Deregister.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `deviceLicenseDeregister$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  deviceLicenseDeregister(params: DeviceLicenseDeregister$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.deviceLicenseDeregister$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `deviceLicenseRevoke()` */
  static readonly DeviceLicenseRevokePath = '/bff/admin/device-licenses/licenses/{licenseId}';

  /**
   * Revoke.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `deviceLicenseRevoke()` instead.
   *
   * This method doesn't expect any request body.
   */
  deviceLicenseRevoke$Response(params: DeviceLicenseRevoke$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return deviceLicenseRevoke(this.http, this.rootUrl, params, context);
  }

  /**
   * Revoke.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `deviceLicenseRevoke$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  deviceLicenseRevoke(params: DeviceLicenseRevoke$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.deviceLicenseRevoke$Response(params, context).pipe(
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

/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { backupEvents } from '../fn/backup-controller/backup-events';
import { BackupEvents$Params } from '../fn/backup-controller/backup-events';
import { backupHistory } from '../fn/backup-controller/backup-history';
import { BackupHistory$Params } from '../fn/backup-controller/backup-history';
import { backupStartBackup } from '../fn/backup-controller/backup-start-backup';
import { BackupStartBackup$Params } from '../fn/backup-controller/backup-start-backup';
import { backupStartRestore } from '../fn/backup-controller/backup-start-restore';
import { BackupStartRestore$Params } from '../fn/backup-controller/backup-start-restore';
import { backupUsbDevices } from '../fn/backup-controller/backup-usb-devices';
import { BackupUsbDevices$Params } from '../fn/backup-controller/backup-usb-devices';
import { ServerSentEventJobEvent } from '../models/server-sent-event-job-event';

@Injectable({ providedIn: 'root' })
export class BackupControllerService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `backupStartRestore()` */
  static readonly BackupStartRestorePath = '/bff/admin/restores';

  /**
   * Start restore.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `backupStartRestore()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  backupStartRestore$Response(params: BackupStartRestore$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return backupStartRestore(this.http, this.rootUrl, params, context);
  }

  /**
   * Start restore.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `backupStartRestore$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  backupStartRestore(params: BackupStartRestore$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.backupStartRestore$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `backupHistory()` */
  static readonly BackupHistoryPath = '/bff/admin/backups';

  /**
   * History.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `backupHistory()` instead.
   *
   * This method doesn't expect any request body.
   */
  backupHistory$Response(params?: BackupHistory$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return backupHistory(this.http, this.rootUrl, params, context);
  }

  /**
   * History.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `backupHistory$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  backupHistory(params?: BackupHistory$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.backupHistory$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `backupStartBackup()` */
  static readonly BackupStartBackupPath = '/bff/admin/backups';

  /**
   * Start backup.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `backupStartBackup()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  backupStartBackup$Response(params: BackupStartBackup$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return backupStartBackup(this.http, this.rootUrl, params, context);
  }

  /**
   * Start backup.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `backupStartBackup$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  backupStartBackup(params: BackupStartBackup$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.backupStartBackup$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `backupUsbDevices()` */
  static readonly BackupUsbDevicesPath = '/bff/admin/usb-devices';

  /**
   * Usb devices.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `backupUsbDevices()` instead.
   *
   * This method doesn't expect any request body.
   */
  backupUsbDevices$Response(params?: BackupUsbDevices$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
    return backupUsbDevices(this.http, this.rootUrl, params, context);
  }

  /**
   * Usb devices.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `backupUsbDevices$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  backupUsbDevices(params?: BackupUsbDevices$Params, context?: HttpContext): Observable<{
[key: string]: {
};
}> {
    return this.backupUsbDevices$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
[key: string]: {
};
}>): {
[key: string]: {
};
} => r.body)
    );
  }

  /** Path part for operation `backupEvents()` */
  static readonly BackupEventsPath = '/bff/admin/backups/{id}/events';

  /**
   * Events.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `backupEvents()` instead.
   *
   * This method doesn't expect any request body.
   */
  backupEvents$Response(params: BackupEvents$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<ServerSentEventJobEvent>>> {
    return backupEvents(this.http, this.rootUrl, params, context);
  }

  /**
   * Events.
   *
   *
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `backupEvents$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  backupEvents(params: BackupEvents$Params, context?: HttpContext): Observable<Array<ServerSentEventJobEvent>> {
    return this.backupEvents$Response(params, context).pipe(
      map((r: StrictHttpResponse<Array<ServerSentEventJobEvent>>): Array<ServerSentEventJobEvent> => r.body)
    );
  }

}

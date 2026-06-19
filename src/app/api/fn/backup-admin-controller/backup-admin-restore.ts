/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';


export interface BackupAdminRestore$Params {
  id: string;
  'X-Backup-StepUp'?: string;
  Authorization?: string;
}

export function backupAdminRestore(http: HttpClient, rootUrl: string, params: BackupAdminRestore$Params, context?: HttpContext): Observable<StrictHttpResponse<{
[key: string]: {
};
}>> {
  const rb = new RequestBuilder(rootUrl, backupAdminRestore.PATH, 'post');
  if (params) {
    rb.path('id', params.id, {});
    rb.header('X-Backup-StepUp', params['X-Backup-StepUp'], {});
    rb.header('Authorization', params.Authorization, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<{
      [key: string]: {
      };
      }>;
    })
  );
}

backupAdminRestore.PATH = '/bff/admin/cloud-backups/{id}/restore';

/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { DataBuffer } from '../../models/data-buffer';

export interface AdminSshKeyIssuancePrivateKey$Params {
  id: string;
  'X-SshKeyIssue-StepUp'?: string;
}

export function adminSshKeyIssuancePrivateKey(http: HttpClient, rootUrl: string, params: AdminSshKeyIssuancePrivateKey$Params, context?: HttpContext): Observable<StrictHttpResponse<Array<DataBuffer>>> {
  const rb = new RequestBuilder(rootUrl, adminSshKeyIssuancePrivateKey.PATH, 'get');
  if (params) {
    rb.path('id', params.id, {});
    rb.header('X-SshKeyIssue-StepUp', params['X-SshKeyIssue-StepUp'], {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Array<DataBuffer>>;
    })
  );
}

adminSshKeyIssuancePrivateKey.PATH = '/bff/admin/ssh-issue/issued/{id}/private-key';

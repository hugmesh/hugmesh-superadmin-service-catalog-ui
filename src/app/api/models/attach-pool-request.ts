/* tslint:disable */
/* eslint-disable */
export interface AttachPoolRequest {
  diskSerial: string;
  exclusive?: boolean;
  filesystem?: string;
  poolPath: string;
  reservedBytes?: number;
}

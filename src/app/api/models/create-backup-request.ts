/* tslint:disable */
/* eslint-disable */
export interface CreateBackupRequest {
  destinationKind: string;
  destinationRef: string;
  encryptionMeta?: string;
  services: Array<string>;
  setKey?: string;
}

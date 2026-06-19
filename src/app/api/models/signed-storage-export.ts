/* tslint:disable */
/* eslint-disable */
import { StorageExportBody } from '../models/storage-export-body';
export interface SignedStorageExport {
  body?: StorageExportBody;
  contentHash?: string;
  publicKey?: string;
  signature?: string;
  signed?: boolean;
}

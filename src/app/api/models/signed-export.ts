/* tslint:disable */
/* eslint-disable */
import { ExportBody } from '../models/export-body';
export interface SignedExport {
  body?: ExportBody;
  contentHash?: string;
  publicKey?: string;
  signature?: string;
  signed?: boolean;
}

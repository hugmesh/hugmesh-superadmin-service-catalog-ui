/* tslint:disable */
/* eslint-disable */
import { VpnExportBody } from '../models/vpn-export-body';
export interface SignedVpnExport {
  body?: VpnExportBody;
  contentHash?: string;
  publicKey?: string;
  signature?: string;
  signed?: boolean;
}

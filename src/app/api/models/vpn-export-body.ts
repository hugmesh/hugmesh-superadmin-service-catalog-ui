/* tslint:disable */
/* eslint-disable */
import { VpnEgressEntry } from '../models/vpn-egress-entry';
export interface VpnExportBody {
  entries?: Array<VpnEgressEntry>;
  generation?: number;
  node?: string;
}

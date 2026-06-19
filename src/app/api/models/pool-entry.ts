/* tslint:disable */
/* eslint-disable */
import { AssignmentEntry } from '../models/assignment-entry';
export interface PoolEntry {
  assignments?: Array<AssignmentEntry>;
  diskSerial?: string;
  filesystem?: string;
  isExclusive?: boolean;
  poolId?: string;
  poolPath?: string;
  reservedBytes?: number;
}

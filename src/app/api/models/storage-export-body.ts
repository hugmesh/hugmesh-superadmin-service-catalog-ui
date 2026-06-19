/* tslint:disable */
/* eslint-disable */
import { PoolEntry } from '../models/pool-entry';
export interface StorageExportBody {
  generation?: number;
  nodeFp?: string;
  pools?: Array<PoolEntry>;
}

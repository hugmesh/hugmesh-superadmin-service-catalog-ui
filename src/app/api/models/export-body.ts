/* tslint:disable */
/* eslint-disable */
import { AuthorizedOperator } from '../models/authorized-operator';
export interface ExportBody {
  generation?: number;
  meshId?: string;
  operators?: Array<AuthorizedOperator>;
}

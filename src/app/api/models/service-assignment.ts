/* tslint:disable */
/* eslint-disable */
export interface ServiceAssignment {
  active?: boolean;
  assignedAt?: string;
  assignedBy?: string;
  domain?: string;
  generation?: number;
  id?: string;
  poolId?: string;
  propagationState?: string;
  pvcName?: string;
  requestedBytes?: number;
  revokedAt?: string;
  revokedBy?: string;
  serviceName?: string;
  state?: string;
}

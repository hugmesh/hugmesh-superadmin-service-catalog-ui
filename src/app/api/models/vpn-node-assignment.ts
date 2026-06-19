/* tslint:disable */
/* eslint-disable */
export interface VpnNodeAssignment {
  active?: boolean;
  assignedAt?: string;
  assignedBy?: string;
  configId?: string;
  deviceScoped?: boolean;
  domain?: string;
  domainScoped?: boolean;
  generation?: number;
  id?: string;
  propagationState?: string;
  revokedAt?: string;
  revokedBy?: string;
  scopeType?: string;
  serviceSlug?: string;
  state?: string;
  targetDomain?: string;
  targetNodeId?: string;
}

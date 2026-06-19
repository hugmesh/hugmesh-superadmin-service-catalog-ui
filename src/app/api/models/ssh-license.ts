/* tslint:disable */
/* eslint-disable */
export interface SshLicense {
  active?: boolean;
  deviceId?: string;
  deviceScoped?: boolean;
  domain?: string;
  domainScoped?: boolean;
  generation?: number;
  grantedAt?: string;
  grantedBy?: string;
  id?: string;
  keyFingerprints?: string;
  operator?: string;
  propagationState?: string;
  revokedAt?: string;
  revokedBy?: string;
  scopeType?: string;
  state?: string;
  targetDomain?: string;
}

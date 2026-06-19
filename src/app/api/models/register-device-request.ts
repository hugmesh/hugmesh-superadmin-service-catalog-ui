/* tslint:disable */
/* eslint-disable */
export interface RegisterDeviceRequest {
  domain: string;
  hardwareClass?: string;
  hostname: string;
  imageType?: string;
  machineKeyFp: string;
  meshId: string;
  ownerType?: string;
  physicalOwner: string;
  tailnetId?: string;
}

/* tslint:disable */
/* eslint-disable */
export interface StartBackupRequest {
  encrypt?: boolean;
  password?: string;
  scope: Array<string>;
  target: string;
  usbDeviceId?: string;
}

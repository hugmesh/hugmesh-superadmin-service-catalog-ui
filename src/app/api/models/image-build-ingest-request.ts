/* tslint:disable */
/* eslint-disable */
export interface ImageBuildIngestRequest {
  completed?: boolean;
  deviceId?: string;
  dialPubFp?: string;
  dialUser?: string;
  error?: string;
  hostKeyFp?: string;
  hostKeyPub?: string;
  hostname?: string;
  imageRef?: string;
  k8sSecretName?: string;
  keysRef?: string;
  machineKeyFp?: string;
  message?: string;
  status: string;
  vaultRef?: string;
}

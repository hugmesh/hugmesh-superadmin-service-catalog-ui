/* tslint:disable */
/* eslint-disable */
import { ContainerSummary } from '../models/container-summary';
export interface PodSummary {
  containers?: Array<ContainerSummary>;
  name?: string;
  namespace?: string;
  node?: string;
  phase?: string;
  ready?: boolean;
  restarts?: number;
  startedAt?: string;
  workload?: string;
}

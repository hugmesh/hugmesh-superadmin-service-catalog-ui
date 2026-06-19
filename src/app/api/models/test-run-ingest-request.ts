/* tslint:disable */
/* eslint-disable */
export interface TestRunIngestRequest {
  durationMs?: number;
  failed?: number;
  kind: string;
  message?: string;
  passed?: number;
  percent?: number;
  role?: string;
  runLevel?: boolean;
  skipped?: number;
  state: string;
  suite?: string;
}

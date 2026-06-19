/* tslint:disable */
/* eslint-disable */
export interface TestRun {
  commit_sha?: string;
  created_at?: string;
  duration_ms?: number;
  error?: string;
  failed?: number;
  finished_at?: string;
  id?: string;
  job_name?: string;
  passed?: number;
  report_ref?: string;
  skipped?: number;
  started_at?: string;
  status?: string;
  tier?: string;
  total_tests?: number;
  trigger_source?: string;
  triggered_by?: string;
}

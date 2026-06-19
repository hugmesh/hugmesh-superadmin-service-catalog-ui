/* tslint:disable */
/* eslint-disable */
import { TestRun } from '../models/test-run';
import { TestRunResult } from '../models/test-run-result';
export interface TestRunDetail {
  results?: Array<TestRunResult>;
  run?: TestRun;
}

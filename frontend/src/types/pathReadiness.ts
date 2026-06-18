import type { SchedulingPath } from './patient';

export interface ReadinessCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface PathReadinessResult {
  path: SchedulingPath;
  readyToSchedule: boolean;
  checks: ReadinessCheck[];
  summary: string;
  messages: string[];
  decisions: string[];
}

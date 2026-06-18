export const APP_TITLE = 'CLINICAL ACCESS ORCHESTRATION AGENT DEMO - GI SCHEDULER';
export const SIDEBAR_SECTION = 'GI ACCESS MANAGEMENT';

export const NAV_ITEMS = [
  { path: '/', label: 'Work Queue', icon: 'queue' },
  { path: '/agent-review', label: 'Agent Review', icon: 'agent' },
  { path: '/scheduler-review', label: 'Scheduler Review', icon: 'review' },
  { path: '/metrics', label: 'Metrics', icon: 'metrics' },
] as const;

export const SOP_MANDATE_COPY =
  'Do not communicate final appointment type to the patient until the decision tree is fully processed.';

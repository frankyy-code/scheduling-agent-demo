const STORAGE_KEY = 'scheduler-demo-feedback';
const METRICS_KEY = 'scheduler-demo-metrics';

export interface FeedbackEntry {
  id: string;
  patientId: string;
  action: 'accept' | 'override' | 'manual-review';
  reason?: string;
  timestamp: string;
}

export interface DemoMetrics {
  orderToScheduledHours: number;
  firstTryRightFitRate: number;
  schedulerThroughput: number;
  overrideRate: number;
  acuityAgreementRate: number;
  highPriorityWaitReduction: number;
  accepts: number;
  overrides: number;
  manualReviews: number;
  totalReviews: number;
}

const DEFAULT_METRICS: DemoMetrics = {
  orderToScheduledHours: 72,
  firstTryRightFitRate: 0.62,
  schedulerThroughput: 18,
  overrideRate: 0.18,
  acuityAgreementRate: 0.74,
  highPriorityWaitReduction: 0.31,
  accepts: 0,
  overrides: 0,
  manualReviews: 0,
  totalReviews: 0,
};

export function getFeedbackEntries(): FeedbackEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addFeedbackEntry(entry: Omit<FeedbackEntry, 'id' | 'timestamp'>): FeedbackEntry {
  const full: FeedbackEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  const entries = [...getFeedbackEntries(), full];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  updateMetricsFromFeedback(full);
  return full;
}

export function getMetrics(): DemoMetrics {
  try {
    const raw = localStorage.getItem(METRICS_KEY);
    return raw ? { ...DEFAULT_METRICS, ...JSON.parse(raw) } : { ...DEFAULT_METRICS };
  } catch {
    return { ...DEFAULT_METRICS };
  }
}

function updateMetricsFromFeedback(entry: FeedbackEntry): void {
  const m = getMetrics();
  m.totalReviews += 1;
  if (entry.action === 'accept') {
    m.accepts += 1;
    m.acuityAgreementRate = Math.min(0.99, m.acuityAgreementRate + 0.02);
    m.highPriorityWaitReduction = Math.min(0.99, m.highPriorityWaitReduction + 0.03);
  } else if (entry.action === 'override') {
    m.overrides += 1;
    m.overrideRate = m.overrides / m.totalReviews;
    m.firstTryRightFitRate = Math.max(0.4, m.firstTryRightFitRate - 0.02);
  } else {
    m.manualReviews += 1;
  }
  m.schedulerThroughput += 1;
  m.orderToScheduledHours = Math.max(24, m.orderToScheduledHours - 4);
  localStorage.setItem(METRICS_KEY, JSON.stringify(m));
}

export function resetFeedbackStore(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(METRICS_KEY);
}

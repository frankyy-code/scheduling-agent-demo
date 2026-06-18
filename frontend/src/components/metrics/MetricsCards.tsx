import { getMetrics } from '../../services/feedbackStore';

const METRIC_LABELS: { key: keyof ReturnType<typeof getMetrics>; label: string; format: (v: number) => string }[] = [
  { key: 'orderToScheduledHours', label: 'Order-to-Scheduled Time', format: (v) => `${v}h avg` },
  { key: 'firstTryRightFitRate', label: 'First-Try Right-Fit Rate', format: (v) => `${(v * 100).toFixed(0)}%` },
  { key: 'schedulerThroughput', label: 'Scheduler Throughput', format: (v) => `${v} cases/day` },
  { key: 'overrideRate', label: 'Override Rate', format: (v) => `${(v * 100).toFixed(0)}%` },
  { key: 'acuityAgreementRate', label: 'Acuity Agreement Rate', format: (v) => `${(v * 100).toFixed(0)}%` },
  { key: 'highPriorityWaitReduction', label: 'High-Priority Wait Reduction', format: (v) => `${(v * 100).toFixed(0)}%` },
];

export function MetricsCards() {
  const metrics = getMetrics();

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {METRIC_LABELS.map(({ key, label, format }) => (
        <div key={key} className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase">{label}</p>
          <p className="text-2xl font-bold text-mayo-navy mt-2">{format(metrics[key] as number)}</p>
        </div>
      ))}
      <div className="bg-white rounded-lg border border-gray-200 p-6 md:col-span-2 lg:col-span-3">
        <p className="text-xs font-semibold text-gray-400 uppercase">Review Activity</p>
        <div className="flex gap-8 mt-3 text-sm">
          <span>Accepts: {metrics.accepts}</span>
          <span>Overrides: {metrics.overrides}</span>
          <span>Manual reviews: {metrics.manualReviews}</span>
          <span>Total: {metrics.totalReviews}</span>
        </div>
      </div>
    </div>
  );
}

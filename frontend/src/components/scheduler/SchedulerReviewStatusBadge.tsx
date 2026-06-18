import type { SchedulerReviewStatus } from '../../services/schedulerReviewStatus';
import { SCHEDULER_STATUS_STYLES } from '../../services/schedulerReviewStatus';

interface SchedulerReviewStatusBadgeProps {
  status: SchedulerReviewStatus;
  compact?: boolean;
}

export function SchedulerReviewStatusBadge({
  status,
  compact = false,
}: SchedulerReviewStatusBadgeProps) {
  const styles = SCHEDULER_STATUS_STYLES[status.tone];

  return (
    <span
      className={`text-xs font-semibold px-2 py-1 rounded-full ${styles.badge}`}
      title={status.detail}
    >
      {status.label}
      {!compact && status.tone === 'yellow' ? ' ⚠' : ''}
    </span>
  );
}

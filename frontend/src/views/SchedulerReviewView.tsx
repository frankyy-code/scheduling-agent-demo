import { Link } from 'react-router-dom';
import { useDemoState } from '../hooks/useDemoState';
import type { AcuityResult } from '../types/rubric';
import { PatientReviewSummary } from '../components/scheduler/PatientReviewSummary';
import { ReviewActions } from '../components/scheduler/ReviewActions';
import { SchedulerReviewStatusBadge } from '../components/scheduler/SchedulerReviewStatusBadge';
import { getDisplaySchedulingPath } from '../services/displaySchedulingPath';
import { getSchedulerReviewStatus } from '../services/schedulerReviewStatus';

export function SchedulerReviewView() {
  const {
    rankedQueue,
    agentReviewStarted,
    submitReviewAction,
    getSopState,
    slotBookings,
    getSchedulingStepId,
  } = useDemoState();

  if (!agentReviewStarted) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <p className="text-gray-600">Start AI Agent Review from the Work Queue first.</p>
        <Link to="/" className="text-mayo-navy text-sm mt-4 inline-block underline">
          Go to Work Queue
        </Link>
      </div>
    );
  }

  const ranked = rankedQueue.filter(
    (p): p is typeof p & { acuity: AcuityResult } => p.acuity !== null,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Scheduler Review</h2>
        <p className="text-sm text-gray-600 mt-1">
          Expand a patient to review pathing, room hold, and agent recommendations before
          accepting, overriding, or sending to manual review.
        </p>
      </div>

      {ranked.map((p) => {
        const sopState = getSopState(p.patientId);
        const roomBooking = slotBookings.find((b) => b.patientId === p.patientId);
        const pathReadiness = p.pathReadiness;
        const reviewStatus = getSchedulerReviewStatus(
          p,
          sopState,
          roomBooking,
          getSchedulingStepId(p.patientId),
        );
        const displayPath = getDisplaySchedulingPath(pathReadiness?.path, sopState);
        const showPathBadge =
          displayPath.showPathBadge &&
          !(reviewStatus.tone === 'red' && displayPath.path === 'clarification');
        const pathStyle =
          displayPath.path === 'standard'
            ? 'bg-green-100 text-green-800'
            : displayPath.path === 'clarification'
              ? 'bg-red-100 text-red-800'
              : 'bg-mayo-light-blue text-mayo-navy';

        return (
          <details
            key={p.patientId}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden group"
          >
            <summary className="px-6 py-4 cursor-pointer list-none flex flex-wrap items-center justify-between gap-3 hover:bg-gray-50">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-gray-400 group-open:rotate-90 transition-transform">▶</span>
                <div>
                  <p className="font-semibold text-gray-900">
                    #{p.rank} {p.displayName}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5" title={reviewStatus.detail}>
                    Acuity {p.acuity.tier} · {reviewStatus.detail}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {showPathBadge && displayPath.label && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${pathStyle}`}>
                    {displayPath.label}
                  </span>
                )}
                <SchedulerReviewStatusBadge status={reviewStatus} />
              </div>
            </summary>

            <div className="px-6 pb-6 border-t border-gray-100 pt-4">
              <PatientReviewSummary
                patient={p}
                acuity={p.acuity}
                sopState={sopState}
                roomBooking={roomBooking}
                reviewStatus={reviewStatus}
                routingText={displayPath.routingText}
              />

              <ReviewActions
                patientId={p.patientId}
                patientName={p.displayName}
                status={p.status}
                onAccept={() => submitReviewAction(p.patientId, 'accept')}
                onOverride={(reason) => submitReviewAction(p.patientId, 'override', reason)}
                onManualReview={() => submitReviewAction(p.patientId, 'manual-review')}
              />
            </div>
          </details>
        );
      })}
    </div>
  );
}

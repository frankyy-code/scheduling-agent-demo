import { Link } from 'react-router-dom';
import { useAgentReview } from '../hooks/useAgentReview';
import { PathReadinessPanel } from '../components/agent/PathReadinessPanel';
import { AgentReasoningPanel } from '../components/agent/AgentReasoningPanel';
import { CarePathwayGraph } from '../components/agent/CarePathwayGraph';
import { ConstraintCallout } from '../components/agent/ConstraintCallout';
import { getPathwayForPatient } from '../data/pathways';
import { getDisplaySchedulingPath } from '../services/displaySchedulingPath';

export function AgentReviewView() {
  const {
    rankedQueue,
    compassSession,
    agentReviewTriggered,
    agentReviewLoading,
    agentReviewStarted,
    selectedPatient,
    getSopState,
  } = useAgentReview();

  if (!agentReviewTriggered && !agentReviewStarted) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <p className="text-gray-600">Start AI Agent Review from the Work Queue first.</p>
        <Link to="/" className="text-mayo-navy text-sm mt-4 inline-block underline">
          Go to Work Queue
        </Link>
      </div>
    );
  }

  if (agentReviewLoading || !agentReviewStarted) {
    return (
      <div className="bg-white rounded-lg border p-10 text-center space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-mayo-navy border-t-transparent animate-spin" />
        <div>
          <p className="font-semibold text-gray-900">AI Agent Review in progress</p>
          <p className="text-sm text-gray-600 mt-2">
            Evaluating order completeness, pathing, acuity, and readiness across the queue...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Agent Reasoning — Ranked Queue</h2>
          <p className="text-sm text-gray-500 mt-1">
            Review results persist while you navigate the portal. Expand a patient to see details.
          </p>
        </div>
        <Link
          to="/scheduler-review"
          className="px-4 py-2 bg-mayo-navy text-white text-sm rounded-md"
        >
          Continue to Scheduler Review →
        </Link>
      </div>

      {rankedQueue.map((p) => {
        if (!p.acuity || !p.pathReadiness) return null;

        const failedChecks = p.pathReadiness.checks.filter((check) => !check.passed).length;
        const displayPath = getDisplaySchedulingPath(p.pathReadiness.path, getSopState(p.patientId));

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
                  <p className="text-xs text-gray-500 mt-0.5">
                    Acuity {p.acuity.tier} · {p.pathReadiness.checks.length} checks ·{' '}
                    {failedChecks > 0 ? `${failedChecks} failed` : 'all passed'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {displayPath.showPathBadge && displayPath.label && (
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      displayPath.path === 'standard'
                        ? 'bg-green-100 text-green-800'
                        : displayPath.path === 'clarification'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-mayo-light-blue text-mayo-navy'
                    }`}
                  >
                    {displayPath.label}
                  </span>
                )}
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    p.pathReadiness.readyToSchedule
                      ? 'bg-green-700 text-white'
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  {p.pathReadiness.readyToSchedule ? 'Ready' : 'Not ready'}
                </span>
              </div>
            </summary>

            <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
              <PathReadinessPanel
                readiness={p.pathReadiness}
                routingText={displayPath.routingText}
              />
              <AgentReasoningPanel
                patientName={p.displayName}
                acuity={p.acuity}
                rank={p.rank}
                compassSessionId={
                  p.patientId === selectedPatient?.patientId
                    ? compassSession?.sessionId
                    : undefined
                }
              />
              <CarePathwayGraph steps={getPathwayForPatient(p.patientId)} patientId={p.patientId} />
              <ConstraintCallout patientId={p.patientId} />
            </div>
          </details>
        );
      })}
    </div>
  );
}

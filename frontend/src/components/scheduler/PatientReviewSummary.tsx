import type { QueuePatient } from '../../types/patient';
import type { AcuityResult } from '../../types/rubric';
import type { BookedSlot } from '../../types/scheduling';
import type { SopState } from '../../hooks/useDemoState';
import { getSopAnswerRows } from '../../data/sopDecisionTree';
import { getRoomAvailability } from '../../services/mockDataLoaders';
import {
  deriveRoomRequirements,
  evaluateRoomMatch,
  type RoomMatchStatus,
} from '../../services/roomMatchingService';
import type { SchedulerReviewStatus } from '../../services/schedulerReviewStatus';
import { useDemoState } from '../../hooks/useDemoState';

interface PatientReviewSummaryProps {
  patient: QueuePatient;
  acuity: AcuityResult;
  sopState: SopState;
  roomBooking: BookedSlot | undefined;
  reviewStatus: SchedulerReviewStatus;
  routingText: string;
}

export function PatientReviewSummary({
  patient,
  acuity,
  sopState,
  roomBooking,
  reviewStatus,
  routingText,
}: PatientReviewSummaryProps) {
  const { getSchedulingStepId } = useDemoState();
  const answerRows = getSopAnswerRows(sopState);
  const readiness = patient.pathReadiness;
  const roomMatch = getRoomMatch(patient, roomBooking, getSchedulingStepId(patient.patientId));

  return (
    <div className="space-y-5 mb-6">
      <section className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-900">Pathing &amp; Readiness (Agent)</h4>
        </div>
        <div className="p-4 space-y-4">
          {reviewStatus.tone === 'red' && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-100 rounded-md p-3">
              {reviewStatus.detail}
            </p>
          )}
          {reviewStatus.tone === 'yellow' && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-md p-3">
              {reviewStatus.detail}
            </p>
          )}
          {!readiness ? (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-md p-3">
              Run AI agent review to evaluate order completeness and routing path.
            </p>
          ) : (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-mayo-navy">
                  Routing
                </p>
                <p className="text-sm text-gray-700 mt-1">{routingText}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  Agent pathing summary
                </p>
                <p className="text-sm text-gray-700">{readiness.summary}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Order completeness &amp; accuracy
                </p>
                <ul className="space-y-1">
                  {readiness.checks.slice(0, 6).map((check) => (
                    <li key={check.id} className="text-sm text-gray-700">
                      {check.passed ? '✓' : '!'} {check.label}
                    </li>
                  ))}
                  {readiness.checks.length > 6 && (
                    <li className="text-xs text-gray-500">
                      + {readiness.checks.length - 6} additional checks in Agent Review
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Messages</p>
                <ul className="space-y-1">
                  {readiness.messages.map((message) => (
                    <li key={message} className="text-sm text-gray-700">
                      · {message}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  Scheduler decisions
                </p>
                <ul className="space-y-1">
                  {readiness.decisions.map((decision) => (
                    <li key={decision} className="text-sm text-gray-800">
                      · {decision}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </section>

      {answerRows.length > 0 && (
        <section className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-900">Intake Decision Tree Responses</h4>
          </div>
          <div className="p-4 space-y-3">
            {answerRows.map((row) => (
              <div key={row.question}>
                <p className="text-xs text-gray-500">{row.question}</p>
                <p className="text-sm font-medium text-mayo-navy mt-0.5">{row.answer}</p>
              </div>
            ))}
            {sopState.showTemplate && (
              <p className="text-xs text-gray-600">
                Intake template:{' '}
                {sopState.templateSubmitted ? 'Submitted' : 'Required — not yet submitted'}
              </p>
            )}
          </div>
        </section>
      )}

      <section className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-900">Selected Room Slot</h4>
        </div>
        <div className="p-4">
          {!roomBooking ? (
            <p className="text-sm text-gray-600">
              {readiness?.path === 'clarification'
                ? 'No room hold expected until clarification is resolved.'
                : 'No room slot selected yet. Choose a hold in Schedule Data on the Work Queue.'}
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">{roomBooking.roomName}</p>
              <p className="text-sm text-gray-600">{formatSlot(roomBooking.start)}</p>
              {roomMatch && (
                <RoomMatchNote status={roomMatch.status} reason={roomMatch.reason} />
              )}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-900">Agent Acuity</h4>
        </div>
        <div className="p-4 space-y-2">
          <p className="text-sm text-gray-700">
            Acuity tier: <strong>{acuity.tier}</strong> (score {acuity.score})
          </p>
          {acuity.reasons.length > 0 && (
            <ul className="space-y-1">
              {acuity.reasons.slice(0, 3).map((reason) => (
                <li key={reason} className="text-sm text-gray-600">
                  · {reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function getRoomMatch(
  patient: QueuePatient,
  booking: BookedSlot | undefined,
  selectedStepId: number | null,
) {
  if (!booking) return null;

  const room = getRoomAvailability().rooms.find((r) => r.roomId === booking.roomId);
  if (!room) return null;

  const requirements = deriveRoomRequirements(patient, selectedStepId);
  return evaluateRoomMatch(room, requirements);
}

function RoomMatchNote({ status, reason }: { status: RoomMatchStatus; reason: string }) {
  if (status === 'recommended') {
    return (
      <p className="text-xs text-green-800 bg-green-50 border border-green-100 rounded-md p-2">
        Recommended slot — {reason}
      </p>
    );
  }

  if (status === 'acceptable') {
    return (
      <p className="text-xs text-mayo-navy bg-mayo-light-blue border border-blue-100 rounded-md p-2">
        Suitable slot — {reason}
      </p>
    );
  }

  return (
    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-md p-2">
      Warning: {reason}
    </p>
  );
}

function formatSlot(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

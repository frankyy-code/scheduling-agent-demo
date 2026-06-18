import { getPathwayForPatient } from '../../data/pathways';
import {
  getAgentRecommendedStepId,
  getEffectiveSchedulingStepId,
} from '../../services/careStepScheduling';
import type { QueuePatient } from '../../types/patient';
import { useDemoState } from '../../hooks/useDemoState';

interface CareSequencePreviewProps {
  patient: QueuePatient;
}

export function CareSequencePreview({ patient }: CareSequencePreviewProps) {
  const { getSchedulingStepId, setSchedulingStepId } = useDemoState();
  const pathway = getPathwayForPatient(patient.patientId);
  const agentRecommendedStepId = getAgentRecommendedStepId(patient);
  const selectedStepId = getSchedulingStepId(patient.patientId);
  const effectiveStepId = getEffectiveSchedulingStepId(patient, selectedStepId);
  const isManualSelection =
    selectedStepId != null &&
    agentRecommendedStepId != null &&
    selectedStepId !== agentRecommendedStepId;

  if (pathway.length === 0) {
    return null;
  }

  const effectiveStep = pathway.find((step) => step.id === effectiveStepId);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Care Sequence Preview</h3>
        <p className="text-xs text-gray-500 mt-1">
          Select which step you are sub-scheduling for. Room recommendations in Schedule Data
          update to match the selected step.
        </p>
        {effectiveStep && (
          <div className="mt-3 p-3 rounded-md bg-mayo-light-blue border border-blue-100">
            <p className="text-xs font-semibold text-mayo-navy">Scheduling for</p>
            <p className="text-sm text-gray-800 mt-0.5">
              Step {effectiveStep.id}: <strong>{effectiveStep.operation}</strong>
            </p>
            <p className="text-[11px] text-gray-600 mt-1">
              {effectiveStep.provider} @ {effectiveStep.facility}
            </p>
            {isManualSelection && agentRecommendedStepId && (
              <button
                type="button"
                onClick={() => setSchedulingStepId(patient.patientId, null)}
                className="mt-2 text-[11px] text-mayo-navy underline hover:text-mayo-navy-dark"
              >
                Reset to agent recommendation (Step {agentRecommendedStepId})
              </button>
            )}
          </div>
        )}
      </div>

      <ol className="p-4 space-y-2">
        {pathway.map((step) => {
          const isRecommended = step.id === agentRecommendedStepId && selectedStepId == null;
          const isSelected = step.id === effectiveStepId;
          const isSelectable = step.resourceTarget !== 'non-bookable';

          return (
            <li key={step.id}>
              <button
                type="button"
                disabled={!isSelectable}
                onClick={() => setSchedulingStepId(patient.patientId, step.id)}
                className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                  isSelected
                    ? 'border-mayo-navy bg-mayo-light-blue shadow-sm'
                    : isSelectable
                      ? 'border-gray-200 bg-white hover:border-mayo-navy/40 hover:bg-gray-50'
                      : 'border-gray-100 bg-gray-50 opacity-70 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-bold text-mayo-navy mr-2">{step.id}.</span>
                      <strong>{step.operation}</strong>
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {step.provider} @ {step.facility}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">{step.constraints}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {isSelected && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-mayo-navy text-white">
                        Scheduling
                      </span>
                    )}
                    {isRecommended && !isSelected && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                        Agent next
                      </span>
                    )}
                    {!isSelectable && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        Not bookable
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

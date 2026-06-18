import type { QueuePatient } from '../../types/patient';
import type { AcuityResult } from '../../types/rubric';
import { useDemoState } from '../../hooks/useDemoState';
import { getDisplaySchedulingPath } from '../../services/displaySchedulingPath';
import { AcuityDropdown } from './AcuityDropdown';

interface PatientQueueCardProps {
  patient: QueuePatient;
  acuity?: AcuityResult | null;
  selected: boolean;
  onSelect: () => void;
}

export function PatientQueueCard({
  patient,
  acuity,
  selected,
  onSelect,
}: PatientQueueCardProps) {
  const { getSopState } = useDemoState();
  const displayPath = patient.pathReadiness
    ? getDisplaySchedulingPath(patient.pathReadiness.path, getSopState(patient.patientId))
    : null;

  return (
    <div
      className={`rounded-lg border-2 transition-all ${
        selected
          ? 'border-mayo-navy bg-mayo-light-blue shadow-sm'
          : 'border-gray-200 bg-white hover:border-mayo-navy/40'
      }`}
    >
      <button type="button" onClick={onSelect} className="w-full text-left p-4">
        <p className="font-semibold text-gray-900">{patient.displayName}</p>
        <p className="text-sm text-gray-500 mt-1">MRN: {patient.mrn}</p>
        <p className="text-sm text-gray-600 mt-1">Status: {patient.status}</p>
        {displayPath?.showPathBadge && displayPath.label && (
          <p className="text-xs mt-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                displayPath.path === 'standard'
                  ? 'bg-green-100 text-green-800'
                  : displayPath.path === 'procedure-access'
                    ? 'bg-mayo-light-blue text-mayo-navy'
                    : 'bg-amber-100 text-amber-900'
              }`}
            >
              {displayPath.label}
            </span>
          </p>
        )}
      </button>

      <div className="px-4 pb-3">
        {acuity && <AcuityDropdown patient={patient} acuity={acuity} />}
      </div>

      {acuity && patient.urgent && (
        <div className="bg-urgent text-white text-center text-xs font-bold py-1.5 tracking-wider rounded-b-md">
          URGENT
        </div>
      )}
    </div>
  );
}

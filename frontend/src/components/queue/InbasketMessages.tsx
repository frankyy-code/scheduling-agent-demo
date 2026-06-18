import type { QueuePatient } from '../../types/patient';
import { PatientQueueCard } from './PatientQueueCard';
import type { AcuityResult } from '../../types/rubric';

export interface RankedPatient extends QueuePatient {
  rank: number;
  acuity: AcuityResult | null;
}

interface InbasketMessagesProps {
  patients: RankedPatient[];
  selectedPatientId: string | null;
  onSelect: (id: string) => void;
  acuityRevealed: boolean;
}

export function InbasketMessages({
  patients,
  selectedPatientId,
  onSelect,
  acuityRevealed,
}: InbasketMessagesProps) {
  const sorted = acuityRevealed
    ? [...patients].sort((a, b) => (b.acuity?.score ?? 0) - (a.acuity?.score ?? 0))
    : patients;

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Inbasket Messages</h3>
        <span className="text-xs font-medium bg-mayo-light-blue text-mayo-navy px-3 py-1 rounded-full">
          {patients.length} Patient{patients.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="p-4 space-y-3">
        {sorted.map((p) => (
          <PatientQueueCard
            key={p.patientId}
            patient={p}
            acuity={acuityRevealed ? p.acuity : null}
            selected={p.patientId === selectedPatientId}
            onSelect={() => onSelect(p.patientId)}
          />
        ))}
      </div>
    </div>
  );
}

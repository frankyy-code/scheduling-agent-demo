import type { QueuePatient } from '../../types/patient';

function getInitials(name: string): string {
  const parts = name.replace(',', '').trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatDob(dob: string): string {
  const [y, m, d] = dob.split('-');
  return `${m}/${d}/${y}`;
}

interface PatientHeaderProps {
  patient: QueuePatient | null;
}

export function PatientHeader({ patient }: PatientHeaderProps) {
  if (!patient) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-gray-400 text-sm">
        Select a patient from the queue
      </div>
    );
  }

  const { ordersBundle } = patient;
  const p = ordersBundle.patient;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 flex items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-mayo-light-blue border-2 border-mayo-navy flex items-center justify-center text-mayo-navy font-bold text-lg">
        {getInitials(p.name)}
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          {p.name} ({p.firstName})
        </h2>
        <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-500">
          <span>DOB: {formatDob(p.dob)} ({p.age} y)</span>
          <span>MRN: {p.mrn}</span>
          <span className="text-mayo-navy font-medium">{patient.status}</span>
        </div>
      </div>
    </div>
  );
}

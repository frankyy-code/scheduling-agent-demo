import { getRoomAvailability } from '../../services/mockDataLoaders';

interface ConstraintCalloutProps {
  patientId: string;
}

export function ConstraintCallout({ patientId }: ConstraintCalloutProps) {
  if (patientId !== 'robert-tan') return null;

  const { demoConstraints } = getRoomAvailability();
  const c = demoConstraints.tuesdayOrNoPacu;

  return (
    <div className="rounded-lg border-2 border-urgent bg-urgent-bg p-6">
      <p className="text-xs font-bold text-urgent uppercase tracking-wider">Key Demo Moment</p>
      <p className="text-sm text-gray-800 mt-3 leading-relaxed">
        The earliest OR slot is{' '}
        <strong>{new Date(c.orSlot).toLocaleDateString('en-US', { weekday: 'long' })}</strong>,
        but the patient cannot safely take it because cardiology clearance is not complete,
        apixaban hold window is not satisfied, and no inpatient bed is projected to be available.
        The agent recommends{' '}
        <strong>
          {new Date(c.recommendedAlternative).toLocaleDateString('en-US', {
            weekday: 'long',
          })}
        </strong>{' '}
        instead, while pulling forward cardiology clearance and lab work.
      </p>
      <p className="text-xs text-gray-500 mt-3">{c.description}</p>
    </div>
  );
}

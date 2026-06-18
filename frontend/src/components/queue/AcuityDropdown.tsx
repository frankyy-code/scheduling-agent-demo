import { useMemo, useState } from 'react';
import type { QueuePatient } from '../../types/patient';
import type { AcuityResult } from '../../types/rubric';
import { scoreAcuity, acuityInputFromPatient } from '../../services/giAcuityRubric';

interface AcuityDropdownProps {
  patient: QueuePatient;
  acuity?: AcuityResult;
}

export function AcuityDropdown({ patient, acuity: acuityProp }: AcuityDropdownProps) {
  const [open, setOpen] = useState(false);
  const acuity = useMemo(
    () => acuityProp ?? scoreAcuity(acuityInputFromPatient(patient)),
    [patient, acuityProp],
  );

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs border border-gray-200 rounded-md bg-white hover:border-mayo-navy/40"
      >
        <span>
          Acuity:{' '}
          <strong className={acuity.tier === 'High' ? 'text-urgent' : 'text-green-700'}>
            {acuity.tier}
          </strong>{' '}
          · Score {acuity.score}
        </span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-2 p-3 bg-white border border-gray-200 rounded-md max-h-48 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-700 mb-2">How urgency was decided</p>
          <ul className="space-y-2">
            {acuity.breakdown
              .filter((item) => item.points > 0 || item.label.includes('Tier threshold'))
              .map((item, i) => (
                <li
                  key={`${item.label}-${i}`}
                  className="text-xs text-gray-600 border-b border-gray-50 pb-2 last:border-0"
                >
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-800">{item.label}</span>
                    {item.points > 0 && (
                      <span className="font-medium text-mayo-navy shrink-0">+{item.points}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">{item.source}</p>
                </li>
              ))}
          </ul>
          <p className="text-[10px] text-gray-500 mt-2 pt-2 border-t">
            High ≥ 40 points · Routine &lt; 40 points
          </p>
        </div>
      )}
    </div>
  );
}

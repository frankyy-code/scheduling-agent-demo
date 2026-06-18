import { useState } from 'react';
import { OverrideModal } from './OverrideModal';

interface ReviewActionsProps {
  patientId: string;
  patientName: string;
  onAccept: () => void;
  onOverride: (reason: string) => void;
  onManualReview: () => void;
  status: string;
}

export function ReviewActions({
  patientId,
  patientName,
  onAccept,
  onOverride,
  onManualReview,
  status,
}: ReviewActionsProps) {
  const [showOverride, setShowOverride] = useState(false);
  const done = ['Accepted', 'Overridden', 'Manual Review'].includes(status);

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        disabled={done}
        onClick={onAccept}
        className="px-4 py-2 bg-green-700 text-white text-sm rounded-md disabled:opacity-40"
      >
        Accept
      </button>
      <button
        type="button"
        disabled={done}
        onClick={() => setShowOverride(true)}
        className="px-4 py-2 bg-urgent text-white text-sm rounded-md disabled:opacity-40"
      >
        Override
      </button>
      <button
        type="button"
        disabled={done}
        onClick={onManualReview}
        className="px-4 py-2 border border-gray-300 text-sm rounded-md disabled:opacity-40"
      >
        Send to Manual Review
      </button>
      {showOverride && (
        <OverrideModal
          patientName={patientName}
          onConfirm={(reason) => {
            onOverride(reason);
            setShowOverride(false);
          }}
          onCancel={() => setShowOverride(false)}
        />
      )}
      <span className="text-xs text-gray-400 self-center">ID: {patientId}</span>
    </div>
  );
}

import { useState } from 'react';

interface OverrideModalProps {
  patientName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function OverrideModal({ patientName, onConfirm, onCancel }: OverrideModalProps) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="font-semibold text-gray-900">Override — {patientName}</h3>
        <p className="text-sm text-gray-500 mt-2">
          Provide a reason. This feedback improves the acuity rubric.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full mt-4 p-3 border border-gray-200 rounded-md text-sm h-24"
          placeholder="e.g., Cardiology clearance already in progress externally..."
        />
        <div className="flex gap-3 mt-4 justify-end">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border rounded-md">
            Cancel
          </button>
          <button
            type="button"
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason)}
            className="px-4 py-2 text-sm bg-mayo-navy text-white rounded-md disabled:opacity-40"
          >
            Confirm Override
          </button>
        </div>
      </div>
    </div>
  );
}

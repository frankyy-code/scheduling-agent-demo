interface AgentReviewPendingModalProps {
  patientName: string;
  roomName: string;
  slotLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AgentReviewPendingModal({
  patientName,
  roomName,
  slotLabel,
  onConfirm,
  onCancel,
}: AgentReviewPendingModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-mayo-navy/20">
        <p className="text-xs font-semibold uppercase tracking-wide text-mayo-navy">
          AI review pending
        </p>
        <h3 className="font-semibold text-gray-900 mt-1">AI review not yet done</h3>
        <p className="text-sm text-gray-600 mt-2">
          {patientName} · {roomName} · {slotLabel}
        </p>
        <p className="text-sm text-gray-800 mt-3 p-3 rounded-md bg-mayo-light-blue border border-blue-100">
          Order validation and room recommendations are not available until AI agent review
          completes. Do you want to proceed?
        </p>
        <div className="flex gap-3 mt-5 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
          >
            Wait for AI review
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm bg-mayo-navy text-white rounded-md hover:bg-mayo-navy-dark"
          >
            Proceed anyway
          </button>
        </div>
      </div>
    </div>
  );
}

interface RoomMismatchModalProps {
  patientName: string;
  roomName: string;
  slotLabel: string;
  warning: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RoomMismatchModal({
  patientName,
  roomName,
  slotLabel,
  warning,
  onConfirm,
  onCancel,
}: RoomMismatchModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-amber-200">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
          Room mismatch warning
        </p>
        <h3 className="font-semibold text-gray-900 mt-1">Unsuitable room for {patientName}</h3>
        <p className="text-sm text-gray-600 mt-2">
          {roomName} · {slotLabel}
        </p>
        <p className="text-sm text-amber-900 mt-3 p-3 rounded-md bg-amber-50 border border-amber-100">
          {warning}
        </p>
        <div className="flex gap-3 mt-5 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
          >
            Choose another room
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm bg-amber-600 text-white rounded-md hover:bg-amber-700"
          >
            Book anyway
          </button>
        </div>
      </div>
    </div>
  );
}

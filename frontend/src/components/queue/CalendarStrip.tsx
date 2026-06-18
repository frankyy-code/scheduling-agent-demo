import { useMemo, useState } from 'react';
import { useDemoState } from '../../hooks/useDemoState';
import { getProviderAvailability, getRoomAvailability } from '../../services/mockDataLoaders';
import { getSlotUiState } from '../../services/slotBookingService';
import {
  deriveRoomRequirements,
  evaluateRoomMatch,
  formatCapability,
  groupRoomsByCategory,
  type RoomMatchStatus,
} from '../../services/roomMatchingService';
import { AgentReviewPendingModal } from './AgentReviewPendingModal';
import { RoomMismatchModal } from './RoomMismatchModal';
import type { BookedSlot } from '../../types/scheduling';

interface PendingMismatch {
  booking: BookedSlot;
  warning: string;
  slotLabel: string;
}

interface PendingPreReview {
  booking: BookedSlot;
  slotLabel: string;
}

export function CalendarStrip() {
  const {
    selectedPatient,
    slotBookings,
    bookSlot,
    clearPatientSlot,
    agentReviewStarted,
    getSchedulingStepId,
  } = useDemoState();
  const providers = getProviderAvailability().providers;
  const rooms = getRoomAvailability().rooms;
  const [pendingMismatch, setPendingMismatch] = useState<PendingMismatch | null>(null);
  const [pendingPreReview, setPendingPreReview] = useState<PendingPreReview | null>(null);

  const requirements = useMemo(
    () =>
      selectedPatient && agentReviewStarted
        ? deriveRoomRequirements(selectedPatient, getSchedulingStepId(selectedPatient.patientId))
        : null,
    [selectedPatient, agentReviewStarted, getSchedulingStepId],
  );

  const roomMatches = useMemo(() => {
    if (!requirements) return new Map();
    return new Map(rooms.map((room) => [room.roomId, evaluateRoomMatch(room, requirements)]));
  }, [rooms, requirements]);

  const roomGroups = useMemo(() => groupRoomsByCategory(rooms), [rooms]);

  const patientBooking = useMemo(
    () => slotBookings.find((b) => b.patientId === selectedPatient?.patientId),
    [slotBookings, selectedPatient?.patientId],
  );

  const patientBookingMatch = useMemo(() => {
    if (!patientBooking || !requirements) return null;
    const room = rooms.find((r) => r.roomId === patientBooking.roomId);
    if (!room) return null;
    return evaluateRoomMatch(room, requirements);
  }, [patientBooking, requirements, rooms]);

  if (!selectedPatient) {
    return null;
  }

  const attemptBook = (
    booking: BookedSlot,
    matchStatus: RoomMatchStatus | 'neutral',
    warning: string | null,
  ) => {
    const slotLabel = formatSlot(booking.start);

    if (!agentReviewStarted) {
      setPendingPreReview({ booking, slotLabel });
      return;
    }

    if (
      matchStatus === 'incompatible' ||
      matchStatus === 'not-applicable' ||
      matchStatus === 'scheduling-hold'
    ) {
      setPendingMismatch({
        booking,
        warning: warning ?? 'This room does not match current order requirements.',
        slotLabel,
      });
      return;
    }

    bookSlot(booking);
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Schedule Data</h3>
          <p className="text-xs text-gray-500 mt-1">
            {agentReviewStarted
              ? `Select a recommended room slot for ${selectedPatient.displayName}. Holds block capacity for other patients.`
              : `Room availability for ${selectedPatient.displayName}. Run AI agent review to surface order-driven room recommendations.`}
          </p>

          {agentReviewStarted && requirements && (
            <div className="mt-3 p-3 rounded-md bg-mayo-light-blue border border-blue-100">
              <p className="text-xs font-semibold text-mayo-navy">Recommended room criteria</p>
              {requirements.careStepId && (
                <p className="text-[11px] text-mayo-navy mt-1">
                  Care step: {requirements.careStepId} — {requirements.careStepLabel}
                </p>
              )}
              <p className="text-xs text-gray-700 mt-1">{requirements.summary}</p>
              {requirements.sources.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {requirements.sources.map((source) => (
                    <li key={source} className="text-[11px] text-gray-600">
                      · {source}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {patientBooking && (
            <div className="mt-2">
              <p className="text-xs text-mayo-navy">
                Current hold: {patientBooking.roomName} · {formatSlot(patientBooking.start)}
                <button
                  type="button"
                  onClick={() => clearPatientSlot(selectedPatient.patientId)}
                  className="ml-2 underline text-gray-500 hover:text-gray-800"
                >
                  Release
                </button>
              </p>
              {agentReviewStarted &&
                patientBookingMatch &&
                (patientBookingMatch.status === 'incompatible' ||
                  patientBookingMatch.status === 'not-applicable') && (
                  <p className="text-xs text-amber-800 mt-1 p-2 rounded bg-amber-50 border border-amber-100">
                    Warning: current hold is in an unsuitable room — {patientBookingMatch.reason}
                  </p>
                )}
            </div>
          )}
        </div>

        <div
          className={`p-4 max-h-[32rem] overflow-y-auto ${agentReviewStarted ? 'grid md:grid-cols-2 gap-4' : ''}`}
        >
          {agentReviewStarted && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                Provider Slots (view only)
              </p>
              {providers.slice(0, 4).map((prov) => (
                <div key={prov.providerId} className="mb-3 p-3 rounded border border-gray-100 bg-gray-50">
                  <p className="text-sm font-medium">{prov.name}</p>
                  <p className="text-xs text-gray-500">{prov.specialty}</p>
                  {prov.slots.slice(0, 2).map((s) => (
                    <div key={s.start} className="text-xs mt-1 text-gray-600">
                      {formatSlot(s.start)} — {s.appointmentTypes.join(', ')}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Room / Resource Slots</p>
            {roomGroups.map(({ category, rooms: categoryRooms }) => (
              <div key={category} className="mb-5 last:mb-0">
                <p className="text-[11px] font-semibold text-mayo-navy uppercase tracking-wide mb-2">
                  {category}
                </p>
                {categoryRooms.map((room) => {
                  const match = agentReviewStarted
                    ? roomMatches.get(room.roomId)!
                    : { status: 'neutral' as const, reason: '', warning: null };
                  return (
                    <div
                      key={room.roomId}
                      className={`mb-3 p-3 rounded border ${agentReviewStarted ? roomCardClass(match.status) : 'border-gray-100 bg-gray-50'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{room.name}</p>
                        {agentReviewStarted && <RoomMatchBadge status={match.status} />}
                      </div>
                      {agentReviewStarted && match.reason && match.status !== 'acceptable' && (
                        <p className="text-[11px] text-gray-600 mt-1">{match.reason}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2 mb-2">
                        {room.capabilities.map((c) => (
                          <span
                            key={c}
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              agentReviewStarted && requirements
                                ? capabilityClass(c, requirements.requiredCapabilities)
                                : 'bg-mayo-light-blue text-mayo-navy'
                            }`}
                          >
                            {formatCapability(c)}
                          </span>
                        ))}
                      </div>
                      <div className="space-y-1">
                        {room.slots.map((s) => {
                          const { state, bookedBy } = getSlotUiState(
                            room.roomId,
                            s.start,
                            s.status,
                            selectedPatient.patientId,
                            slotBookings,
                          );
                          const bookingDisabled =
                            state === 'unavailable' ||
                            state === 'booked-other' ||
                            (agentReviewStarted && match.status === 'scheduling-hold');
                          const slotMatchStatus =
                            agentReviewStarted && (state === 'available' || state === 'selected')
                              ? match.status
                              : state;

                          return (
                            <button
                              key={s.start}
                              type="button"
                              disabled={bookingDisabled}
                              onClick={() =>
                                attemptBook(
                                  {
                                    roomId: room.roomId,
                                    roomName: room.name,
                                    start: s.start,
                                    end: s.end,
                                    patientId: selectedPatient.patientId,
                                    patientName: selectedPatient.displayName,
                                  },
                                  match.status,
                                  match.warning,
                                )
                              }
                              className={`w-full text-left text-xs px-2 py-1.5 rounded border transition-colors ${slotClass(slotMatchStatus, state, agentReviewStarted)}`}
                            >
                              {formatSlot(s.start)} —{' '}
                              {slotLabel(state, bookedBy, match.status, agentReviewStarted)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {pendingPreReview && (
        <AgentReviewPendingModal
          patientName={selectedPatient.displayName}
          roomName={pendingPreReview.booking.roomName}
          slotLabel={pendingPreReview.slotLabel}
          onCancel={() => setPendingPreReview(null)}
          onConfirm={() => {
            bookSlot(pendingPreReview.booking);
            setPendingPreReview(null);
          }}
        />
      )}

      {pendingMismatch && (
        <RoomMismatchModal
          patientName={selectedPatient.displayName}
          roomName={pendingMismatch.booking.roomName}
          slotLabel={pendingMismatch.slotLabel}
          warning={pendingMismatch.warning}
          onCancel={() => setPendingMismatch(null)}
          onConfirm={() => {
            bookSlot(pendingMismatch.booking);
            setPendingMismatch(null);
          }}
        />
      )}
    </>
  );
}

function RoomMatchBadge({ status }: { status: RoomMatchStatus }) {
  switch (status) {
    case 'recommended':
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800 shrink-0">
          Recommended
        </span>
      );
    case 'acceptable':
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-mayo-navy shrink-0">
          Also suitable
        </span>
      );
    case 'incompatible':
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">
          Not suitable
        </span>
      );
    case 'not-applicable':
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">
          Wrong resource
        </span>
      );
    case 'scheduling-hold':
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 shrink-0">
          Hold
        </span>
      );
    default:
      return null;
  }
}

function roomCardClass(status: RoomMatchStatus | 'neutral'): string {
  switch (status) {
    case 'recommended':
      return 'border-green-200 bg-green-50/40';
    case 'acceptable':
      return 'border-blue-100 bg-gray-50';
    case 'incompatible':
      return 'border-amber-200 bg-amber-50/30';
    case 'not-applicable':
      return 'border-gray-100 bg-gray-50 opacity-75';
    case 'scheduling-hold':
      return 'border-gray-200 bg-gray-100 opacity-80';
    case 'neutral':
    default:
      return 'border-gray-100 bg-gray-50';
  }
}

function capabilityClass(cap: string, required: string[]): string {
  if (required.includes(cap)) {
    return 'bg-mayo-navy text-white font-medium';
  }
  return 'bg-mayo-light-blue text-mayo-navy';
}

function slotClass(
  matchStatus: RoomMatchStatus | 'neutral' | ReturnType<typeof getSlotUiState>['state'],
  bookingState: ReturnType<typeof getSlotUiState>['state'],
  recommendationsEnabled: boolean,
): string {
  if (bookingState === 'selected') {
    return 'border-mayo-navy bg-mayo-light-blue text-mayo-navy font-medium';
  }
  if (bookingState === 'booked-other') {
    return 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed';
  }
  if (bookingState === 'unavailable') {
    return 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed line-through';
  }

  if (!recommendationsEnabled) {
    return 'border-gray-200 bg-white text-gray-800 hover:border-mayo-navy hover:bg-mayo-light-blue cursor-pointer';
  }

  switch (matchStatus) {
    case 'recommended':
      return 'border-green-300 bg-white text-green-900 hover:border-mayo-navy hover:bg-mayo-light-blue cursor-pointer';
    case 'acceptable':
      return 'border-blue-200 bg-white text-gray-800 hover:border-mayo-navy hover:bg-mayo-light-blue cursor-pointer';
    case 'incompatible':
      return 'border-amber-300 bg-amber-50/50 text-amber-900 hover:border-amber-500 cursor-pointer';
    case 'not-applicable':
      return 'border-gray-200 bg-gray-50 text-gray-500 hover:border-amber-400 cursor-pointer';
    case 'scheduling-hold':
      return 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed';
    default:
      return 'border-green-200 bg-white text-green-800 hover:border-mayo-navy hover:bg-mayo-light-blue cursor-pointer';
  }
}

function slotLabel(
  state: ReturnType<typeof getSlotUiState>['state'],
  bookedBy: string | undefined,
  matchStatus: RoomMatchStatus | 'neutral',
  recommendationsEnabled: boolean,
): string {
  switch (state) {
    case 'selected':
      if (!recommendationsEnabled) return 'Selected for this patient';
      return matchStatus === 'incompatible' ||
        matchStatus === 'not-applicable' ||
        matchStatus === 'scheduling-hold'
        ? 'Selected (unsuitable room)'
        : 'Selected for this patient';
    case 'booked-other':
      return `Booked — ${bookedBy}`;
    case 'unavailable':
      return 'Unavailable';
    default:
      if (!recommendationsEnabled) return 'Available — click to hold';
      if (matchStatus === 'recommended') return 'Recommended — click to hold';
      if (matchStatus === 'acceptable') return 'Suitable — click to hold';
      if (matchStatus === 'incompatible') return 'Not suitable — warning if selected';
      if (matchStatus === 'not-applicable') return 'Wrong resource — warning if selected';
      if (matchStatus === 'scheduling-hold') return 'Scheduling hold — do not book';
      return 'Available — click to hold';
  }
}

function formatSlot(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

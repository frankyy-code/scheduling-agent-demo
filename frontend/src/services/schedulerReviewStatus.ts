import type { SopState } from '../hooks/useDemoState';
import type { QueuePatient } from '../types/patient';
import type { BookedSlot } from '../types/scheduling';
import { isDecisionTreeComplete } from '../data/sopDecisionTree';
import { getRoomAvailability } from './mockDataLoaders';
import { deriveRoomRequirements, evaluateRoomMatch } from './roomMatchingService';

export type SchedulerReviewStatusTone = 'red' | 'yellow' | 'green' | 'neutral';

export interface SchedulerReviewStatus {
  tone: SchedulerReviewStatusTone;
  label: string;
  detail: string;
}

function getRoomMatch(
  patient: QueuePatient,
  booking: BookedSlot,
  selectedStepId?: number | null,
) {
  const room = getRoomAvailability().rooms.find((r) => r.roomId === booking.roomId);
  if (!room) return null;
  return evaluateRoomMatch(room, deriveRoomRequirements(patient, selectedStepId));
}

export function getSchedulerReviewStatus(
  patient: QueuePatient,
  sopState: SopState,
  roomBooking: BookedSlot | undefined,
  selectedStepId?: number | null,
): SchedulerReviewStatus {
  const pathReadiness = patient.pathReadiness;

  if (pathReadiness?.path === 'clarification') {
    return {
      tone: 'red',
      label: 'Clarification needed',
      detail: 'Referral must be corrected before scheduling can proceed.',
    };
  }

  if (roomBooking) {
    const roomMatch = getRoomMatch(patient, roomBooking, selectedStepId);
    const badRoom =
      roomMatch &&
      (roomMatch.status === 'incompatible' ||
        roomMatch.status === 'not-applicable' ||
        roomMatch.status === 'scheduling-hold');

    if (badRoom) {
      return {
        tone: 'yellow',
        label: 'Room mismatch',
        detail: roomMatch.reason,
      };
    }

    if (roomMatch?.status === 'acceptable') {
      return {
        tone: 'yellow',
        label: 'Suboptimal room',
        detail: roomMatch.reason,
      };
    }

    if (!isDecisionTreeComplete(sopState)) {
      return {
        tone: 'yellow',
        label: 'Decision tree incomplete',
        detail: 'Room hold selected, but the intake decision tree is not finished.',
      };
    }

    return {
      tone: 'green',
      label: 'Scheduled',
      detail: `${roomBooking.roomName} · decision tree complete · room matches recommendation`,
    };
  }

  return {
    tone: 'neutral',
    label: 'Ready (not scheduled)',
    detail: 'No room hold selected yet.',
  };
}

export const SCHEDULER_STATUS_STYLES: Record<
  SchedulerReviewStatusTone,
  { badge: string; path?: string }
> = {
  red: { badge: 'bg-red-100 text-red-800', path: 'bg-red-100 text-red-800' },
  yellow: { badge: 'bg-amber-100 text-amber-900', path: 'bg-amber-100 text-amber-900' },
  green: { badge: 'bg-green-700 text-white' },
  neutral: { badge: 'bg-gray-100 text-gray-700' },
};

import type { BookedSlot } from '../types/scheduling';

export function slotKey(roomId: string, start: string): string {
  return `${roomId}::${start}`;
}

export type SlotUiState = 'available' | 'selected' | 'booked-other' | 'unavailable';

export function getSlotUiState(
  roomId: string,
  start: string,
  staticStatus: 'open' | 'held' | 'booked',
  currentPatientId: string | null,
  bookings: BookedSlot[],
): { state: SlotUiState; bookedBy?: string } {
  if (staticStatus === 'booked' || staticStatus === 'held') {
    return { state: 'unavailable' };
  }

  const booking = bookings.find((b) => b.roomId === roomId && b.start === start);
  if (!booking) return { state: 'available' };
  if (booking.patientId === currentPatientId) return { state: 'selected' };
  return { state: 'booked-other', bookedBy: booking.patientName };
}

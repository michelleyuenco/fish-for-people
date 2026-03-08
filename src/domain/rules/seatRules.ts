import type { Seat, SeatSummary, SectionName } from '../models/Seat';
import { SECTIONS, TOTAL_SEATS, SECTION_TOTALS } from '../constants/seating';

export function computeSeatSummaries(seats: Seat[]): SeatSummary[] {
  const summaryMap = new Map<string, SeatSummary>();

  // Initialize all rows
  for (const section of SECTIONS) {
    for (let row = 1; row <= section.rows; row++) {
      const key = `${section.name}-${row}`;
      const totalSeats = section.seatsPerRow(row);
      summaryMap.set(key, {
        section: section.name,
        row,
        totalSeats,
        availableSeats: totalSeats,
        occupiedSeats: 0,
        reservedSeats: 0,
      });
    }
  }

  // Apply seat states
  for (const seat of seats) {
    const key = `${seat.section}-${seat.row}`;
    const summary = summaryMap.get(key);
    if (summary) {
      if (seat.occupied) {
        summary.occupiedSeats += 1;
        summary.availableSeats -= 1;
      } else if (seat.reservedFor !== 'none') {
        summary.reservedSeats += 1;
        summary.availableSeats -= 1;
      }
    }
  }

  return Array.from(summaryMap.values());
}

export function getAvailableCount(seats: Seat[]): number {
  const occupiedCount = seats.filter((s) => s.occupied).length;
  const reservedCount = seats.filter((s) => !s.occupied && s.reservedFor !== 'none').length;
  return TOTAL_SEATS - occupiedCount - reservedCount;
}

export function getReservedCount(seats: Seat[]): number {
  return seats.filter((s) => s.reservedFor !== 'none' && !s.occupied).length;
}

export function getOccupiedCount(seats: Seat[]): number {
  return seats.filter((s) => s.occupied).length;
}

export function getSectionAvailability(seats: Seat[]): Record<SectionName, number> {
  // Start from per-section totals and subtract occupied seats.
  const result: Record<SectionName, number> = {
    left: SECTION_TOTALS.left,
    middle: SECTION_TOTALS.middle,
    right: SECTION_TOTALS.right,
  };
  for (const seat of seats) {
    if (seat.occupied || (!seat.occupied && seat.reservedFor !== 'none')) {
      result[seat.section] -= 1;
    }
  }
  return result;
}

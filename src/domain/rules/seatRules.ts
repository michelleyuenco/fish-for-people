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
      });
    }
  }

  // Apply seat states
  for (const seat of seats) {
    const key = `${seat.section}-${seat.row}`;
    const summary = summaryMap.get(key);
    if (summary && seat.occupied) {
      summary.occupiedSeats += 1;
      summary.availableSeats -= 1;
    }
  }

  return Array.from(summaryMap.values());
}

export function getAvailableCount(seats: Seat[]): number {
  // Available = total seats minus those explicitly marked occupied in Firestore.
  // Seats with no Firestore doc at all are available by default.
  const occupiedCount = seats.filter((s) => s.occupied).length;
  return TOTAL_SEATS - occupiedCount;
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
    if (seat.occupied) {
      result[seat.section] -= 1;
    }
  }
  return result;
}

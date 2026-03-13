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

/** Aggregate seat counts in a single pass over the seats array. */
export interface SeatCounts {
  occupied: number;
  reserved: number;
  sectionAvailability: Record<SectionName, number>;
}

export function aggregateSeatCounts(seats: Seat[]): SeatCounts {
  let occupied = 0;
  let reserved = 0;
  const sectionAvailability: Record<SectionName, number> = {
    left: SECTION_TOTALS.left,
    middle: SECTION_TOTALS.middle,
    right: SECTION_TOTALS.right,
  };

  for (const seat of seats) {
    if (seat.occupied) {
      occupied += 1;
      sectionAvailability[seat.section] -= 1;
    } else if (seat.reservedFor !== 'none') {
      reserved += 1;
      sectionAvailability[seat.section] -= 1;
    }
  }

  return { occupied, reserved, sectionAvailability };
}

export function getAvailableCount(seats: Seat[]): number {
  const { occupied, reserved } = aggregateSeatCounts(seats);
  return TOTAL_SEATS - occupied - reserved;
}

export function getReservedCount(seats: Seat[]): number {
  return aggregateSeatCounts(seats).reserved;
}

export function getOccupiedCount(seats: Seat[]): number {
  return aggregateSeatCounts(seats).occupied;
}

export function getSectionAvailability(seats: Seat[]): Record<SectionName, number> {
  return aggregateSeatCounts(seats).sectionAvailability;
}

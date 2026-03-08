import type { SectionName } from '../models/Seat';

export interface SectionConfig {
  name: SectionName;
  label: string;
  rows: number;
  seatsPerRow: (row: number) => number; // row is 1-indexed
}

/**
 * Left section: 14 rows. Row 1: 6 seats. Rows 2–14: 7 seats. Total: 97 seats
 * Middle section: 14 rows. Row 1: 12 seats. Rows 2–14: 13 seats. Total: 181 seats
 * Right section: 13 rows. Row 1: 6 seats. Rows 2–13: 7 seats. Total: 90 seats
 * Grand total: 368 seats
 */
export const SECTIONS: SectionConfig[] = [
  {
    name: 'left',
    label: 'Left',
    rows: 14,
    seatsPerRow: (row) => (row === 1 ? 6 : 7),
  },
  {
    name: 'middle',
    label: 'Middle',
    rows: 14,
    seatsPerRow: (row) => (row === 1 ? 12 : 13),
  },
  {
    name: 'right',
    label: 'Right',
    rows: 13,
    seatsPerRow: (row) => (row === 1 ? 6 : 7),
  },
];

export function getSeatId(section: SectionName, row: number, col: number): string {
  return `${section}-${row}-${col}`;
}

export function parseSeatId(id: string): { section: SectionName; row: number; col: number } | null {
  const parts = id.split('-');
  if (parts.length !== 3) return null;
  const section = parts[0] as SectionName;
  const row = parseInt(parts[1], 10);
  const col = parseInt(parts[2], 10);
  if (!['left', 'middle', 'right'].includes(section)) return null;
  if (isNaN(row) || isNaN(col)) return null;
  return { section, row, col };
}

export function getTotalSeatsForSection(name: SectionName): number {
  const config = SECTIONS.find((s) => s.name === name);
  if (!config) return 0;
  let total = 0;
  for (let row = 1; row <= config.rows; row++) {
    total += config.seatsPerRow(row);
  }
  return total;
}

export function getAllSeatIds(): string[] {
  const ids: string[] = [];
  for (const section of SECTIONS) {
    for (let row = 1; row <= section.rows; row++) {
      const seatsInRow = section.seatsPerRow(row);
      for (let col = 1; col <= seatsInRow; col++) {
        ids.push(getSeatId(section.name, row, col));
      }
    }
  }
  return ids;
}

/**
 * Permanent row-level reservations — these designate the purpose of a row,
 * not actual occupancy. Users still toggle seats to mark them occupied.
 */
export type RowReservationType = 'family' | 'volunteer';

export interface RowReservation {
  section: SectionName;
  row: number;
  type: RowReservationType;
  label: string;
}

export const ROW_RESERVATIONS: RowReservation[] = [
  { section: 'left', row: 11, type: 'family', label: 'Family / Elderly' },
  { section: 'left', row: 12, type: 'family', label: 'Family / Elderly' },
  { section: 'left', row: 13, type: 'family', label: 'Family / Elderly' },
  { section: 'left', row: 14, type: 'volunteer', label: 'Volunteers' },
];

/** Quick lookup: returns the reservation type for a given section+row, or undefined */
export function getRowReservation(section: SectionName, row: number): RowReservationType | undefined {
  return ROW_RESERVATIONS.find((r) => r.section === section && r.row === row)?.type;
}

export const TOTAL_SEATS = 368;

export const SECTION_TOTALS: Record<SectionName, number> = {
  left: 97,
  middle: 181,
  right: 90,
};

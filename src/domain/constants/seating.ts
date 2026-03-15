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

/**
 * Row label mapping: row 1 (closest to stage) = "AA", row 2 = "A", row 3 = "B", …
 */
export function getRowLabel(row: number): string {
  if (row === 1) return 'AA';
  return String.fromCharCode(64 + row - 1); // row 2 → 'A', row 3 → 'B', …
}

/**
 * Get the global (continuous) seat number for a seat within a row.
 * Seats are numbered left-to-right across all sections:
 *   Left 1–N_left, Middle N_left+1–N_left+N_mid, Right N_left+N_mid+1–…
 *
 * Row 14 (M): Left 1–7, Middle 8–20 (right section doesn't have row 14)
 * Row 2 (A):  Left 1–7, Middle 8–20, Right 21–27
 * Row 1 (AA): Left 1–6, Middle 7–18, Right 19–24
 */
export function getGlobalSeatNumber(section: SectionName, row: number, col: number): number {
  let offset = 0;
  for (const s of SECTIONS) {
    if (s.name === section) break;
    if (row <= s.rows) {
      offset += s.seatsPerRow(row);
    }
  }
  return offset + col;
}

/** Returns the human-readable coordinate for a seat, e.g. "M5", "AA12" */
export function getSeatCoordinate(section: SectionName, row: number, col: number): string {
  return `${getRowLabel(row)}${getGlobalSeatNumber(section, row, col)}`;
}

/**
 * Returns the [start, end] global seat numbers for a section in a given row.
 * E.g. for middle section, row 14 → [8, 20]
 */
export function getSectionSeatRange(section: SectionName, row: number): [number, number] {
  const config = SECTIONS.find((s) => s.name === section);
  if (!config || row > config.rows) return [0, 0];
  const start = getGlobalSeatNumber(section, row, 1);
  const end = getGlobalSeatNumber(section, row, config.seatsPerRow(row));
  return [start, end];
}

export const TOTAL_SEATS = 368;

export const SECTION_TOTALS: Record<SectionName, number> = {
  left: 97,
  middle: 181,
  right: 90,
};

// ─── Region definitions for approximate zone-based floor plan ────────────────

export interface RegionConfig {
  id: string;
  section: SectionName;
  label: string;       // i18n suffix: 'front', 'frontMid', 'mid', 'back', 'rear', 'family', 'volunteer'
  startRow: number;
  endRow: number;      // inclusive
  reservation?: RowReservationType;  // optional designation for special-purpose regions
}

export const REGIONS: RegionConfig[] = [
  // Left section (14 rows) — 5 regions (I merged into FGH; JKL=family; M=volunteer)
  { id: 'left-front',     section: 'left',   label: 'front',     startRow: 1,  endRow: 3  },
  { id: 'left-frontMid',  section: 'left',   label: 'frontMid',  startRow: 4,  endRow: 6  },
  { id: 'left-mid',       section: 'left',   label: 'mid',       startRow: 7,  endRow: 10 },
  { id: 'left-family',    section: 'left',   label: 'family',    startRow: 11, endRow: 13, reservation: 'family' },
  { id: 'left-volunteer', section: 'left',   label: 'volunteer', startRow: 14, endRow: 14, reservation: 'volunteer' },
  // Middle section (14 rows) — 5 regions
  { id: 'middle-front',    section: 'middle', label: 'front',    startRow: 1,  endRow: 3  },
  { id: 'middle-frontMid', section: 'middle', label: 'frontMid', startRow: 4,  endRow: 6  },
  { id: 'middle-mid',      section: 'middle', label: 'mid',      startRow: 7,  endRow: 9  },
  { id: 'middle-back',     section: 'middle', label: 'back',     startRow: 10, endRow: 12 },
  { id: 'middle-rear',     section: 'middle', label: 'rear',     startRow: 13, endRow: 14 },
  // Right section (13 rows) — 4 regions (uniform 3 rows, last has 4)
  { id: 'right-front',    section: 'right',  label: 'front',    startRow: 1,  endRow: 3  },
  { id: 'right-frontMid', section: 'right',  label: 'frontMid', startRow: 4,  endRow: 6  },
  { id: 'right-mid',      section: 'right',  label: 'mid',      startRow: 7,  endRow: 9  },
  { id: 'right-back',     section: 'right',  label: 'back',     startRow: 10, endRow: 13 },
];

export function getRegionSeatCount(region: RegionConfig): number {
  const section = SECTIONS.find((s) => s.name === region.section)!;
  let total = 0;
  for (let row = region.startRow; row <= region.endRow; row++) {
    total += section.seatsPerRow(row);
  }
  return total;
}

export function getRegionsForSection(section: SectionName): RegionConfig[] {
  return REGIONS.filter((r) => r.section === section);
}

/** Row range label for display, e.g. "AA–B" for rows 1-3 */
export function getRegionRowRange(region: RegionConfig): string {
  return `${getRowLabel(region.startRow)}–${getRowLabel(region.endRow)}`;
}

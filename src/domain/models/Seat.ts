export type SectionName = 'left' | 'middle' | 'right';
export type ReservedFor = 'none' | 'family' | 'volunteer';

export interface Seat {
  id: string;           // format: "{section}-{row}-{col}"
  section: SectionName;
  row: number;
  col: number;
  occupied: boolean;
  reservedFor: ReservedFor;
  updatedAt: Date | null;
}

export interface SeatSummary {
  section: SectionName;
  row: number;
  totalSeats: number;
  availableSeats: number;
  occupiedSeats: number;
  reservedSeats: number;
}

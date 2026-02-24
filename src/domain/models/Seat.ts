export type SectionName = 'left' | 'middle' | 'right';

export interface Seat {
  id: string;           // format: "{section}-{row}-{col}"
  section: SectionName;
  row: number;
  col: number;
  occupied: boolean;
  updatedAt: Date | null;
}

export interface SeatSummary {
  section: SectionName;
  row: number;
  totalSeats: number;
  availableSeats: number;
  occupiedSeats: number;
}

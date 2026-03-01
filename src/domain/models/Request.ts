import type { SectionName } from './Seat';

export type RequestType = 'Pen' | 'Sermon Notes' | 'Water' | 'Bible' | 'Prayer' | 'Other';
export type RequestStatus = 'pending' | 'resolved';

export interface ServiceRequest {
  id: string;
  section: SectionName;
  row: number;
  /**
   * Human-readable area label from the floor-plan picker, e.g. "Front", "Middle", "Back".
   * Present when submitted via FloorPlanPicker; absent for legacy row-dropdown submissions.
   */
  areaLabel?: string;
  type: RequestType;
  note: string;
  status: RequestStatus;
  createdAt: Date;
  resolvedAt: Date | null;
}

export const REQUEST_TYPES: RequestType[] = [
  'Pen',
  'Sermon Notes',
  'Water',
  'Bible',
  'Prayer',
  'Other',
];

import type { SectionName } from './Seat';

export type RequestType = 'Pen' | 'Sermon Notes' | 'Water' | 'Bible' | 'Prayer' | 'Other';
export type RequestStatus = 'pending' | 'resolved';

export interface ServiceRequest {
  id: string;
  section: SectionName;
  row: number;
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

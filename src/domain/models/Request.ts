import type { SectionName } from './Seat';

export type RequestType =
  | 'Pen'
  | 'Sermon Notes'
  | 'Offering Envelope'
  | 'Offering Envelope (Dream Now)'
  | 'Voiceover Device'
  | 'Prayer'
  | 'Other';

export type RequestStatus = 'pending' | 'resolved';

export interface ServiceRequest {
  id: string;
  section: SectionName;
  row: number;
  areaLabel?: string;
  type: RequestType;
  quantity: number;
  note: string;
  /** Contact name — required for Voiceover Device requests */
  contactName?: string;
  /** Contact phone — required for Voiceover Device requests (for device return follow-up) */
  contactPhone?: string;
  status: RequestStatus;
  createdAt: Date;
  resolvedAt: Date | null;
}

export const REQUEST_TYPES: RequestType[] = [
  'Pen',
  'Sermon Notes',
  'Offering Envelope',
  'Offering Envelope (Dream Now)',
  'Voiceover Device',
  'Prayer',
  'Other',
];

/** Types where quantity makes sense (physical items) */
export const QUANTIFIABLE_TYPES: RequestType[] = [
  'Pen',
  'Sermon Notes',
  'Offering Envelope',
  'Offering Envelope (Dream Now)',
  'Voiceover Device',
];

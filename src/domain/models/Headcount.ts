import type { SessionName } from '../constants/sessions';

export type ZoneName = 'left' | 'middle' | 'right' | 'production' | 'outside';

export interface ZoneCounts {
  left: number;
  middle: number;
  right: number;
  production: number;
  outside: number;
}

export interface HeadcountEntry {
  id: string;
  counterName: string;
  session: SessionName;
  counts: ZoneCounts;
  total: number;
  submittedAt: Date;
  updatedAt: Date;
}

export interface ConfirmedCount {
  id: string;
  date: string;                       // YYYY-MM-DD
  session: SessionName;
  counters: HeadcountEntry[];         // 1-3 raw entries for reference
  totals: ZoneCounts;                 // the official agreed numbers
  confirmedBy: string;                // counter label who confirmed
  confirmedAt: Date | null;
}

/** Visual comparison aid — not a confirmation gate. */
export interface HeadcountDiscrepancy {
  zone: ZoneName;
  countA: number;
  countB: number;
  diff: number;
}

/** Ordered list of zone keys. Use i18n key `zones.${key}` for display labels. */
export const ZONE_KEYS: ZoneName[] = ['left', 'middle', 'right', 'production', 'outside'];

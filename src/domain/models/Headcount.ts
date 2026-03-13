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
  counts: ZoneCounts;
  total: number;
  submittedAt: Date;
}

export interface ConfirmedCount {
  id: string;
  date: string;                // YYYY-MM-DD
  counterA: HeadcountEntry | null;
  counterB: HeadcountEntry | null;
  confirmed: boolean;
  totals: ZoneCounts | null;
  confirmedAt: Date | null;
}

export interface HeadcountDiscrepancy {
  zone: ZoneName;
  countA: number;
  countB: number;
  diff: number;
}

/** Ordered list of zone keys. Use i18n key `zones.${key}` for display labels. */
export const ZONE_KEYS: ZoneName[] = ['left', 'middle', 'right', 'production', 'outside'];

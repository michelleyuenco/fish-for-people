export type SessionName = 'morning' | 'noon' | 'afternoon';

export interface SessionConfig {
  name: SessionName;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  i18nKey: string;
}

export const SESSIONS: SessionConfig[] = [
  { name: 'morning',   startHour: 10, startMinute: 0,  endHour: 11, endMinute: 30, i18nKey: 'sessions.morning' },
  { name: 'noon',      startHour: 12, startMinute: 0,  endHour: 13, endMinute: 30, i18nKey: 'sessions.noon' },
  { name: 'afternoon', startHour: 14, startMinute: 0,  endHour: 15, endMinute: 30, i18nKey: 'sessions.afternoon' },
];

export const SESSION_NAMES: SessionName[] = ['morning', 'noon', 'afternoon'];

export function getSessionConfig(name: SessionName): SessionConfig {
  return SESSIONS.find((s) => s.name === name)!;
}

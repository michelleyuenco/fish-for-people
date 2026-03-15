import { SESSIONS, type SessionName, type SessionConfig } from '../constants/sessions';

function toMinutes(hour: number, minute: number): number {
  return hour * 60 + minute;
}

function nowMinutes(now: Date): number {
  return toMinutes(now.getHours(), now.getMinutes());
}

/** Returns the session that is currently active (within its time window), or null. */
export function getCurrentSession(now: Date): SessionConfig | null {
  const m = nowMinutes(now);
  return SESSIONS.find((s) => m >= toMinutes(s.startHour, s.startMinute) && m < toMinutes(s.endHour, s.endMinute)) ?? null;
}

/** True if the current time is past the session's end time. */
export function isSessionLocked(session: SessionName, now: Date): boolean {
  const cfg = SESSIONS.find((s) => s.name === session)!;
  return nowMinutes(now) >= toMinutes(cfg.endHour, cfg.endMinute);
}

/** True if the current time is within the session's start–end window. */
export function isSessionActive(session: SessionName, now: Date): boolean {
  const cfg = SESSIONS.find((s) => s.name === session)!;
  const m = nowMinutes(now);
  return m >= toMinutes(cfg.startHour, cfg.startMinute) && m < toMinutes(cfg.endHour, cfg.endMinute);
}

/** True if the current time is before the session's start time. */
export function isBeforeSessionStart(session: SessionName, now: Date): boolean {
  const cfg = SESSIONS.find((s) => s.name === session)!;
  return nowMinutes(now) < toMinutes(cfg.startHour, cfg.startMinute);
}

/** Returns the next session after the given one, or null for afternoon. */
export function getNextSession(session: SessionName): SessionName | null {
  const idx = SESSIONS.findIndex((s) => s.name === session);
  return idx < SESSIONS.length - 1 ? SESSIONS[idx + 1].name : null;
}

/** True if the session is the last one of the day (afternoon). */
export function isLastSession(session: SessionName): boolean {
  return session === 'afternoon';
}

/** Format a session's time range as a string, e.g. "10:00–11:30". */
export function formatSessionTimeRange(session: SessionName): string {
  const cfg = SESSIONS.find((s) => s.name === session)!;
  const fmt = (h: number, m: number) => `${h}:${String(m).padStart(2, '0')}`;
  return `${fmt(cfg.startHour, cfg.startMinute)}–${fmt(cfg.endHour, cfg.endMinute)}`;
}

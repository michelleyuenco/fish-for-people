import { useState, useEffect, useCallback } from 'react';
import type { SessionName } from '../../domain/constants/sessions';
import { SESSIONS } from '../../domain/constants/sessions';
import {
  getCurrentSession,
  isSessionLocked as checkLocked,
  isSessionActive as checkActive,
  isBeforeSessionStart as checkBefore,
} from '../../domain/rules/sessionRules';

export function useSession() {
  const [now, setNow] = useState(() => new Date());

  // Refresh time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const currentSession = getCurrentSession(now);

  const isLocked = useCallback(
    (session: SessionName) => checkLocked(session, now),
    [now]
  );

  const isActive = useCallback(
    (session: SessionName) => checkActive(session, now),
    [now]
  );

  const isBeforeStart = useCallback(
    (session: SessionName) => checkBefore(session, now),
    [now]
  );

  return {
    now,
    currentSession,
    sessions: SESSIONS,
    isLocked,
    isActive,
    isBeforeStart,
  };
}

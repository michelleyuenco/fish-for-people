import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { HeadcountEntry, ConfirmedCount, ZoneCounts } from '../../domain/models/Headcount';
import type { SessionName } from '../../domain/constants/sessions';
import { getHeadcountService } from '../../infrastructure/services/ServiceProvider';
import { upsertHeadcount, confirmSessionHeadcount } from '../usecases/headcountUseCases';

export function useHeadcount(serviceId: string, session: SessionName) {
  const [entries, setEntries] = useState<HeadcountEntry[]>([]);
  const [confirmedCounts, setConfirmedCounts] = useState<ConfirmedCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  // Debounce timer for auto-save
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!serviceId || !session) return;

    const service = getHeadcountService();

    const unsubEntries = service.subscribeToSessionHeadcounts(
      serviceId,
      session,
      (updatedEntries) => {
        setEntries(updatedEntries);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    const unsubConfirmed = service.subscribeToConfirmedCounts(
      serviceId,
      (counts) => setConfirmedCounts(counts),
      (err) => setError(err)
    );

    return () => {
      unsubEntries();
      unsubConfirmed();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [serviceId, session]);

  /** Debounced auto-save — call on every count change. */
  const saveCount = useCallback(
    (counterLabel: string, counts: ZoneCounts) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaving(true);
      saveTimerRef.current = setTimeout(async () => {
        try {
          await upsertHeadcount(serviceId, counterLabel, session, counts);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to save'));
        } finally {
          setSaving(false);
        }
      }, 500);
    },
    [serviceId, session]
  );

  /** Confirm the session with zone-by-zone picked totals. */
  const confirmSession = useCallback(
    async (confirmedBy: string, officialTotals: ZoneCounts): Promise<void> => {
      setConfirming(true);
      try {
        const date = new Date().toISOString().split('T')[0];
        await confirmSessionHeadcount(serviceId, date, session, confirmedBy, entries, officialTotals);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to confirm'));
      } finally {
        setConfirming(false);
      }
    },
    [serviceId, session, entries]
  );

  /** All counter labels in this session. */
  const counterNames = useMemo(
    () => [...new Set(entries.map((e) => e.counterName))],
    [entries]
  );

  /** Whether this session has been confirmed today. */
  const isConfirmed = useMemo(() => {
    const date = new Date().toISOString().split('T')[0];
    return confirmedCounts.some((c) => c.session === session && c.date === date);
  }, [confirmedCounts, session]);

  /** Get the confirmed count for this session today (if any). */
  const sessionConfirmedCount = useMemo(() => {
    const date = new Date().toISOString().split('T')[0];
    return confirmedCounts.find((c) => c.session === session && c.date === date) ?? null;
  }, [confirmedCounts, session]);

  return {
    entries,
    confirmedCounts,
    counterNames,
    isConfirmed,
    sessionConfirmedCount,
    loading,
    error,
    saving,
    confirming,
    saveCount,
    confirmSession,
  };
}

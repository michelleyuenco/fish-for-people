import { useState, useEffect, useCallback } from 'react';
import type { HeadcountEntry, ConfirmedCount, ZoneCounts } from '../../domain/models/Headcount';
import { getHeadcountService } from '../../infrastructure/services/ServiceProvider';
import { submitHeadcount, confirmHeadcount } from '../usecases/headcountUseCases';
import {
  findDiscrepancies,
  canConfirmHeadcount,
} from '../../domain/rules/headcountRules';

export function useHeadcount(serviceId: string) {
  const [entries, setEntries] = useState<HeadcountEntry[]>([]);
  const [confirmedCounts, setConfirmedCounts] = useState<ConfirmedCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!serviceId) return;

    const service = getHeadcountService();

    const unsubEntries = service.subscribeToHeadcounts(
      serviceId,
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
    };
  }, [serviceId]);

  const handleSubmitHeadcount = useCallback(
    async (counterName: string, counts: ZoneCounts): Promise<{ success: boolean; errors: string[] }> => {
      setSubmitting(true);
      try {
        const result = await submitHeadcount(serviceId, counterName, counts);
        return { success: result.success, errors: result.errors };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit headcount';
        return { success: false, errors: [message] };
      } finally {
        setSubmitting(false);
      }
    },
    [serviceId]
  );

  const handleConfirmHeadcount = useCallback(
    async (entryA: HeadcountEntry, entryB: HeadcountEntry): Promise<void> => {
      setConfirming(true);
      try {
        const date = new Date().toISOString().split('T')[0];
        await confirmHeadcount(serviceId, date, entryA, entryB);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to confirm headcount'));
      } finally {
        setConfirming(false);
      }
    },
    [serviceId]
  );

  // Get the most recent entry per counter name
  const getLatestEntryByCounter = (counterName: string): HeadcountEntry | null => {
    const counterEntries = entries
      .filter((e) => e.counterName.toLowerCase() === counterName.toLowerCase())
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
    return counterEntries[0] || null;
  };

  // Get most recent two distinct counter names
  const counterNames = [...new Set(entries.map((e) => e.counterName))];
  const counterA = counterNames[0] ? getLatestEntryByCounter(counterNames[0]) : null;
  const counterB = counterNames[1] ? getLatestEntryByCounter(counterNames[1]) : null;

  const discrepancies = findDiscrepancies(counterA, counterB);
  const canConfirm = canConfirmHeadcount(counterA, counterB);

  return {
    entries,
    confirmedCounts,
    counterA,
    counterB,
    counterNames,
    discrepancies,
    canConfirm,
    loading,
    error,
    submitting,
    confirming,
    submitHeadcount: handleSubmitHeadcount,
    confirmHeadcount: handleConfirmHeadcount,
    getLatestEntryByCounter,
  };
}

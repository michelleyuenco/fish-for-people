import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { ConfirmedCount } from '../../domain/models/Headcount';
import { SESSION_NAMES } from '../../domain/constants/sessions';
import { getHeadcountService } from '../../infrastructure/services/ServiceProvider';
import { buildFullDaySummaryText, calculateTotal, sumZoneCounts } from '../../domain/rules/headcountRules';
import { cleanupDayData } from '../usecases/headcountUseCases';

export function useFullDaySummary(serviceId: string) {
  const { t } = useTranslation();
  const [confirmedCounts, setConfirmedCounts] = useState<ConfirmedCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Fetch all confirmed counts for today
  useEffect(() => {
    if (!serviceId) return;
    let cancelled = false;

    const service = getHeadcountService();
    service.getConfirmedCountsForDate(serviceId, today).then((counts) => {
      if (!cancelled) {
        setConfirmedCounts(counts);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [serviceId, today]);

  /** Refresh from Firestore (call after confirming a new session). */
  const refresh = useCallback(async () => {
    const service = getHeadcountService();
    const counts = await service.getConfirmedCountsForDate(serviceId, today);
    setConfirmedCounts(counts);
  }, [serviceId, today]);

  const allSessionsConfirmed = SESSION_NAMES.every((s) =>
    confirmedCounts.some((c) => c.session === s)
  );

  const grandTotal = calculateTotal(
    sumZoneCounts(confirmedCounts.map((c) => c.totals))
  );

  const buildShareText = useCallback(() => {
    return buildFullDaySummaryText(today, confirmedCounts, t);
  }, [today, confirmedCounts, t]);

  const handleShare = useCallback(async () => {
    const text = buildShareText();
    try {
      if (navigator.share) {
        await navigator.share({ title: `📊 ${t('headcount.fullDaySummary')} — ${today}`, text });
        return true;
      } else {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // User cancelled or clipboard failed — try clipboard as fallback
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    }
  }, [buildShareText, today, t]);

  /** Delete ALL data from Firestore after user confirms successful send. */
  const handleConfirmSent = useCallback(async () => {
    setCleaning(true);
    try {
      await cleanupDayData(serviceId, today);
      setConfirmedCounts([]);
    } finally {
      setCleaning(false);
    }
  }, [serviceId, today]);

  return {
    confirmedCounts,
    allSessionsConfirmed,
    grandTotal,
    loading,
    cleaning,
    buildShareText,
    handleShare,
    handleConfirmSent,
    refresh,
  };
}

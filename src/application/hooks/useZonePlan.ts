import { useState, useEffect, useMemo, useCallback } from 'react';
import { REGIONS, TOTAL_SEATS, getRegionSeatCount } from '../../domain/constants/seating';
import { STORAGE_KEYS } from '../../domain/constants/storageKeys';
import { buildSyntheticSeatMap, type RegionAvailability } from '../../domain/rules/syntheticSeatMap';

const EMPTY_COUNTS: RegionAvailability = Object.fromEntries(
  REGIONS.map((r) => [r.id, 0]),
);

function loadCounts(): RegionAvailability {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ZONE_COUNTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with empty to ensure all region keys exist
      return { ...EMPTY_COUNTS, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...EMPTY_COUNTS };
}

export function useZonePlan() {
  const [regionCounts, setRegionCounts] = useState<RegionAvailability>(loadCounts);
  const [seed, setSeed] = useState(() => Date.now());

  // Undo / Redo
  const [history, setHistory] = useState<RegionAvailability[]>(() => [loadCounts()]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ZONE_COUNTS, JSON.stringify(regionCounts));
  }, [regionCounts]);

  // Refresh seed every 30s for visual variety on kiosk
  useEffect(() => {
    const timer = setInterval(() => setSeed(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const pushHistory = useCallback((next: RegionAvailability) => {
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), next]);
    setHistoryIndex((i) => i + 1);
  }, [historyIndex]);

  const setRegionCount = useCallback((regionId: string, count: number) => {
    setRegionCounts((prev) => {
      const region = REGIONS.find((r) => r.id === regionId);
      const max = region ? getRegionSeatCount(region) : Infinity;
      const clamped = Math.max(0, Math.min(count, max));
      const next = { ...prev, [regionId]: clamped };
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const clearAll = useCallback(() => {
    const next = { ...EMPTY_COUNTS };
    pushHistory(next);
    setRegionCounts(next);
  }, [pushHistory]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const undo = useCallback(() => {
    if (!canUndo) return;
    const prev = history[historyIndex - 1];
    setHistoryIndex((i) => i - 1);
    setRegionCounts(prev);
  }, [canUndo, history, historyIndex]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    const next = history[historyIndex + 1];
    setHistoryIndex((i) => i + 1);
    setRegionCounts(next);
  }, [canRedo, history, historyIndex]);

  const syntheticSeatMap = useMemo(
    () => buildSyntheticSeatMap(regionCounts, seed),
    [regionCounts, seed],
  );

  const totalAvailable = useMemo(() => {
    let sum = 0;
    for (const region of REGIONS) {
      const max = getRegionSeatCount(region);
      sum += Math.min(regionCounts[region.id] ?? 0, max);
    }
    return sum;
  }, [regionCounts]);

  const totalOccupied = TOTAL_SEATS - totalAvailable;

  return {
    regionCounts,
    setRegionCount,
    clearAll,
    syntheticSeatMap,
    totalAvailable,
    totalOccupied,
    canUndo,
    canRedo,
    undo,
    redo,
  };
}

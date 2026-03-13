import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Seat, ReservedFor, SectionName } from '../../domain/models/Seat';
import { getSeatService } from '../../infrastructure/services/ServiceProvider';
import { toggleSeat, toggleReserved, setRowSeats, setAllSeats } from '../usecases/seatUseCases';
import { computeSeatSummaries, aggregateSeatCounts } from '../../domain/rules/seatRules';
import { TOTAL_SEATS } from '../../domain/constants/seating';

/** A patch records what changed so it can be reversed. */
type UndoPatch = { seatId: string; wasOccupied: boolean }[];

export function useSeats(serviceId: string) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  // Refs for guard checks inside stable callbacks
  const togglingRef = useRef(toggling);
  togglingRef.current = toggling;
  const bulkRef = useRef(false);

  useEffect(() => {
    if (!serviceId) return;

    const service = getSeatService();
    const unsubscribe = service.subscribeToSeats(
      serviceId,
      (updatedSeats) => {
        setSeats(updatedSeats);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [serviceId]);

  // Memoize the lookup map so downstream callbacks don't churn
  const seatMap = useMemo(
    () => new Map<string, Seat>(seats.map((s) => [s.id, s])),
    [seats]
  );

  // Keep a ref so undo/redo always read latest seat state
  const seatMapRef = useRef(seatMap);
  seatMapRef.current = seatMap;

  const summaries = useMemo(() => computeSeatSummaries(seats), [seats]);
  const counts = useMemo(() => aggregateSeatCounts(seats), [seats]);
  const availableCount = TOTAL_SEATS - counts.occupied - counts.reserved;
  const { occupied: occupiedCount, reserved: reservedCount, sectionAvailability } = counts;

  // ── Undo / Redo ──
  const undoStack = useRef<UndoPatch[]>([]);
  const redoStack = useRef<UndoPatch[]>([]);
  const [undoLen, setUndoLen] = useState(0);
  const [redoLen, setRedoLen] = useState(0);

  const pushUndo = useCallback((patch: UndoPatch) => {
    undoStack.current.push(patch);
    redoStack.current = [];
    setUndoLen(undoStack.current.length);
    setRedoLen(0);
  }, []);

  const applyPatch = useCallback(async (patch: UndoPatch) => {
    const service = getSeatService();
    const currentMap = seatMapRef.current;
    for (const { seatId, wasOccupied } of patch) {
      const seat = currentMap.get(seatId);
      if (seat) {
        await service.setSeat(serviceId, seat, wasOccupied);
      }
    }
  }, [serviceId]);

  const handleUndo = useCallback(async () => {
    const patch = undoStack.current.pop();
    if (!patch) return;
    const currentMap = seatMapRef.current;
    const reversePatch: UndoPatch = patch.map(({ seatId }) => {
      const seat = currentMap.get(seatId);
      return { seatId, wasOccupied: seat?.occupied ?? false };
    });
    redoStack.current.push(reversePatch);
    setUndoLen(undoStack.current.length);
    setRedoLen(redoStack.current.length);
    await applyPatch(patch);
  }, [applyPatch]);

  const handleRedo = useCallback(async () => {
    const patch = redoStack.current.pop();
    if (!patch) return;
    const currentMap = seatMapRef.current;
    const reversePatch: UndoPatch = patch.map(({ seatId }) => {
      const seat = currentMap.get(seatId);
      return { seatId, wasOccupied: seat?.occupied ?? false };
    });
    undoStack.current.push(reversePatch);
    setUndoLen(undoStack.current.length);
    setRedoLen(redoStack.current.length);
    await applyPatch(patch);
  }, [applyPatch]);

  // ── Seat operations ──
  const handleToggleSeat = useCallback(
    async (seat: Seat) => {
      if (togglingRef.current.has(seat.id)) return;
      setToggling((prev) => new Set(prev).add(seat.id));
      pushUndo([{ seatId: seat.id, wasOccupied: seat.occupied }]);
      try {
        await toggleSeat(serviceId, seat);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to toggle seat'));
      } finally {
        setToggling((prev) => {
          const next = new Set(prev);
          next.delete(seat.id);
          return next;
        });
      }
    },
    [serviceId, pushUndo]
  );

  const handleToggleReserved = useCallback(
    async (seat: Seat, reserveType: ReservedFor = 'family') => {
      if (togglingRef.current.has(seat.id)) return;
      setToggling((prev) => new Set(prev).add(seat.id));
      try {
        await toggleReserved(serviceId, seat, reserveType);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to toggle reservation'));
      } finally {
        setToggling((prev) => {
          const next = new Set(prev);
          next.delete(seat.id);
          return next;
        });
      }
    },
    [serviceId]
  );

  const [bulkOperating, setBulkOperating] = useState(false);

  const handleSetRowSeats = useCallback(
    async (section: SectionName, row: number, occupied: boolean) => {
      if (bulkRef.current) return;
      bulkRef.current = true;
      setBulkOperating(true);
      const currentMap = seatMapRef.current;
      const patch: UndoPatch = [];
      for (const [id, seat] of currentMap) {
        if (seat.section === section && seat.row === row) {
          patch.push({ seatId: id, wasOccupied: seat.occupied });
        }
      }
      if (patch.length > 0) pushUndo(patch);
      try {
        await setRowSeats(serviceId, section, row, occupied);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to set row seats'));
      } finally {
        bulkRef.current = false;
        setBulkOperating(false);
      }
    },
    [serviceId, pushUndo]
  );

  const handleSetAllSeats = useCallback(
    async (occupied: boolean) => {
      if (bulkRef.current) return;
      bulkRef.current = true;
      setBulkOperating(true);
      const currentMap = seatMapRef.current;
      const patch: UndoPatch = [];
      for (const [id, seat] of currentMap) {
        patch.push({ seatId: id, wasOccupied: seat.occupied });
      }
      if (patch.length > 0) pushUndo(patch);
      try {
        await setAllSeats(serviceId, occupied);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to set all seats'));
      } finally {
        bulkRef.current = false;
        setBulkOperating(false);
      }
    },
    [serviceId, pushUndo]
  );

  return {
    seats,
    seatMap,
    summaries,
    availableCount,
    occupiedCount,
    reservedCount,
    sectionAvailability,
    loading,
    error,
    toggling,
    toggleSeat: handleToggleSeat,
    toggleReserved: handleToggleReserved,
    bulkOperating,
    setRowSeats: handleSetRowSeats,
    setAllSeats: handleSetAllSeats,
    canUndo: undoLen > 0,
    canRedo: redoLen > 0,
    undo: handleUndo,
    redo: handleRedo,
  };
}

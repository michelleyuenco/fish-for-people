import { useState, useEffect, useCallback, useRef } from 'react';
import type { Seat, ReservedFor, SectionName } from '../../domain/models/Seat';
import { getSeatService } from '../../infrastructure/services/ServiceProvider';
import { toggleSeat, toggleReserved, setRowSeats, setAllSeats } from '../usecases/seatUseCases';
import {
  computeSeatSummaries,
  getAvailableCount,
  getOccupiedCount,
  getReservedCount,
  getSectionAvailability,
} from '../../domain/rules/seatRules';

/** A patch records what changed so it can be reversed. */
type UndoPatch = { seatId: string; wasOccupied: boolean }[];

export function useSeats(serviceId: string) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [toggling, setToggling] = useState<Set<string>>(new Set());

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

  // Build a quick lookup map for seat state
  const seatMap = new Map<string, Seat>(seats.map((s) => [s.id, s]));

  const summaries = computeSeatSummaries(seats);
  const availableCount = getAvailableCount(seats);
  const occupiedCount = getOccupiedCount(seats);
  const reservedCount = getReservedCount(seats);
  const sectionAvailability = getSectionAvailability(seats);

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
    for (const { seatId, wasOccupied } of patch) {
      const seat = seatMap.get(seatId);
      if (seat) {
        await service.setSeat(serviceId, seat, wasOccupied);
      }
    }
  }, [serviceId, seatMap]);

  const handleUndo = useCallback(async () => {
    const patch = undoStack.current.pop();
    if (!patch) return;
    const reversePatch: UndoPatch = patch.map(({ seatId }) => {
      const seat = seatMap.get(seatId);
      return { seatId, wasOccupied: seat?.occupied ?? false };
    });
    redoStack.current.push(reversePatch);
    setUndoLen(undoStack.current.length);
    setRedoLen(redoStack.current.length);
    await applyPatch(patch);
  }, [applyPatch, seatMap]);

  const handleRedo = useCallback(async () => {
    const patch = redoStack.current.pop();
    if (!patch) return;
    const reversePatch: UndoPatch = patch.map(({ seatId }) => {
      const seat = seatMap.get(seatId);
      return { seatId, wasOccupied: seat?.occupied ?? false };
    });
    undoStack.current.push(reversePatch);
    setUndoLen(undoStack.current.length);
    setRedoLen(redoStack.current.length);
    await applyPatch(patch);
  }, [applyPatch, seatMap]);

  // ── Seat operations ──
  const handleToggleSeat = useCallback(
    async (seat: Seat) => {
      if (toggling.has(seat.id)) return;
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
    [serviceId, toggling, pushUndo]
  );

  const handleToggleReserved = useCallback(
    async (seat: Seat, reserveType: ReservedFor = 'family') => {
      if (toggling.has(seat.id)) return;
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
    [serviceId, toggling]
  );

  const [bulkOperating, setBulkOperating] = useState(false);

  const handleSetRowSeats = useCallback(
    async (section: SectionName, row: number, occupied: boolean) => {
      if (bulkOperating) return;
      setBulkOperating(true);
      const patch: UndoPatch = [];
      for (const [id, seat] of seatMap) {
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
        setBulkOperating(false);
      }
    },
    [serviceId, bulkOperating, seatMap, pushUndo]
  );

  const handleSetAllSeats = useCallback(
    async (occupied: boolean) => {
      if (bulkOperating) return;
      setBulkOperating(true);
      const patch: UndoPatch = [];
      for (const [id, seat] of seatMap) {
        patch.push({ seatId: id, wasOccupied: seat.occupied });
      }
      if (patch.length > 0) pushUndo(patch);
      try {
        await setAllSeats(serviceId, occupied);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to set all seats'));
      } finally {
        setBulkOperating(false);
      }
    },
    [serviceId, bulkOperating, seatMap, pushUndo]
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

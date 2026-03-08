import { useState, useEffect, useCallback } from 'react';
import type { Seat, ReservedFor } from '../../domain/models/Seat';
import { getSeatService } from '../../infrastructure/services/ServiceProvider';
import { toggleSeat, toggleReserved, setAllSeats } from '../usecases/seatUseCases';
import {
  computeSeatSummaries,
  getAvailableCount,
  getOccupiedCount,
  getReservedCount,
  getSectionAvailability,
} from '../../domain/rules/seatRules';

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

  const handleToggleSeat = useCallback(
    async (seat: Seat) => {
      if (toggling.has(seat.id)) return; // Prevent double-tap
      setToggling((prev) => new Set(prev).add(seat.id));
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
    [serviceId, toggling]
  );

  // Build a quick lookup map for seat state
  const seatMap = new Map<string, Seat>(seats.map((s) => [s.id, s]));

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

  const summaries = computeSeatSummaries(seats);
  const availableCount = getAvailableCount(seats);
  const occupiedCount = getOccupiedCount(seats);
  const reservedCount = getReservedCount(seats);
  const sectionAvailability = getSectionAvailability(seats);

  const [bulkOperating, setBulkOperating] = useState(false);

  const handleSetAllSeats = useCallback(
    async (occupied: boolean) => {
      if (bulkOperating) return;
      setBulkOperating(true);
      try {
        await setAllSeats(serviceId, occupied);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to set all seats'));
      } finally {
        setBulkOperating(false);
      }
    },
    [serviceId, bulkOperating]
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
    setAllSeats: handleSetAllSeats,
  };
}

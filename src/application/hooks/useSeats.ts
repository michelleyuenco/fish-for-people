import { useState, useEffect, useCallback } from 'react';
import type { Seat } from '../../domain/models/Seat';
import { getSeatService } from '../../infrastructure/services/ServiceProvider';
import { toggleSeat } from '../usecases/seatUseCases';
import {
  computeSeatSummaries,
  getAvailableCount,
  getOccupiedCount,
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

  const summaries = computeSeatSummaries(seats);
  const availableCount = getAvailableCount(seats);
  const occupiedCount = getOccupiedCount(seats);
  const sectionAvailability = getSectionAvailability(seats);

  return {
    seats,
    seatMap,
    summaries,
    availableCount,
    occupiedCount,
    sectionAvailability,
    loading,
    error,
    toggling,
    toggleSeat: handleToggleSeat,
  };
}

import { useState, useEffect, useCallback } from 'react';
import type { ServiceRequest, RequestType } from '../../domain/models/Request';
import type { SectionName } from '../../domain/models/Seat';
import { getRequestService } from '../../infrastructure/services/ServiceProvider';
import { submitRequest, resolveRequest } from '../usecases/requestUseCases';
import {
  getPendingRequests,
  getResolvedRequests,
  sortRequestsByTime,
} from '../../domain/rules/requestRules';

export function useRequests(serviceId: string) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [resolving, setResolving] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!serviceId) return;

    const service = getRequestService();
    const unsubscribe = service.subscribeToRequests(
      serviceId,
      (updatedRequests) => {
        setRequests(updatedRequests);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [serviceId]);

  const handleSubmitRequest = useCallback(
    async (payload: {
      section: SectionName;
      row: number;
      areaLabel?: string;
      type: RequestType;
      note: string;
    }): Promise<{ success: boolean; requestId?: string }> => {
      setSubmitting(true);
      try {
        const requestId = await submitRequest({ serviceId, ...payload });
        return { success: true, requestId };
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to submit request'));
        return { success: false };
      } finally {
        setSubmitting(false);
      }
    },
    [serviceId]
  );

  const handleResolveRequest = useCallback(
    async (requestId: string): Promise<void> => {
      if (resolving.has(requestId)) return;
      setResolving((prev) => new Set(prev).add(requestId));
      try {
        await resolveRequest(serviceId, requestId);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to resolve request'));
      } finally {
        setResolving((prev) => {
          const next = new Set(prev);
          next.delete(requestId);
          return next;
        });
      }
    },
    [serviceId, resolving]
  );

  const pendingRequests = sortRequestsByTime(getPendingRequests(requests));
  const resolvedRequests = sortRequestsByTime(getResolvedRequests(requests)).reverse();
  const pendingCount = pendingRequests.length;

  return {
    requests,
    allRequests: requests,
    pendingRequests,
    resolvedRequests,
    pendingCount,
    loading,
    error,
    resolving,
    submitting,
    submitRequest: handleSubmitRequest,
    resolveRequest: handleResolveRequest,
  };
}

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  const [deleting, setDeleting] = useState(false);

  // Refs for guard checks inside stable callbacks
  const resolvingRef = useRef(resolving);
  resolvingRef.current = resolving;
  const deletingRef = useRef(deleting);
  deletingRef.current = deleting;

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
      quantity: number;
      note: string;
      contactName?: string;
      contactPhone?: string;
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
      if (resolvingRef.current.has(requestId)) return;
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
    [serviceId]
  );

  const handleDeleteAll = useCallback(
    async (): Promise<void> => {
      if (deletingRef.current) return;
      setDeleting(true);
      try {
        const service = getRequestService();
        await service.deleteAllRequests(serviceId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to delete requests');
        setError(error);
        throw error;
      } finally {
        setDeleting(false);
      }
    },
    [serviceId]
  );

  const pendingRequests = useMemo(
    () => sortRequestsByTime(getPendingRequests(requests)),
    [requests]
  );
  const resolvedRequests = useMemo(
    () => sortRequestsByTime(getResolvedRequests(requests)).reverse(),
    [requests]
  );
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
    deleting,
    submitRequest: handleSubmitRequest,
    resolveRequest: handleResolveRequest,
    deleteAllRequests: handleDeleteAll,
  };
}

import type { ServiceRequest } from '../models/Request';

export function canResolveRequest(request: ServiceRequest): boolean {
  return request.status === 'pending';
}

export function formatTimeElapsed(createdAt: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${diffHour}h ${diffMin % 60}m ago`;
}

export function sortRequestsByTime(requests: ServiceRequest[]): ServiceRequest[] {
  return [...requests].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );
}

export function getPendingRequests(requests: ServiceRequest[]): ServiceRequest[] {
  return requests.filter((r) => r.status === 'pending');
}

export function getResolvedRequests(requests: ServiceRequest[]): ServiceRequest[] {
  return requests.filter((r) => r.status === 'resolved');
}

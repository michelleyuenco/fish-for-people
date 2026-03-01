import type { RequestType } from '../../domain/models/Request';
import type { SectionName } from '../../domain/models/Seat';
import { getRequestService } from '../../infrastructure/services/ServiceProvider';

export interface SubmitRequestPayload {
  serviceId: string;
  section: SectionName;
  row: number;
  areaLabel?: string;
  type: RequestType;
  note: string;
}

export async function submitRequest(payload: SubmitRequestPayload): Promise<string> {
  const service = getRequestService();
  return service.submitRequest(payload.serviceId, {
    section: payload.section,
    row: payload.row,
    areaLabel: payload.areaLabel,
    type: payload.type,
    note: payload.note,
  });
}

export async function resolveRequest(serviceId: string, requestId: string): Promise<void> {
  const service = getRequestService();
  await service.resolveRequest(serviceId, requestId);
}

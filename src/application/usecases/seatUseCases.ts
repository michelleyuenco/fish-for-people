import type { Seat } from '../../domain/models/Seat';
import { getSeatService } from '../../infrastructure/services/ServiceProvider';

export async function toggleSeat(serviceId: string, seat: Seat): Promise<void> {
  const service = getSeatService();
  await service.toggleSeat(serviceId, seat);
}

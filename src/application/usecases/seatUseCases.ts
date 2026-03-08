import type { Seat, ReservedFor, SectionName } from '../../domain/models/Seat';
import { getSeatService } from '../../infrastructure/services/ServiceProvider';

export async function toggleSeat(serviceId: string, seat: Seat): Promise<void> {
  const service = getSeatService();
  await service.toggleSeat(serviceId, seat);
}

export async function toggleReserved(serviceId: string, seat: Seat, reserveType: ReservedFor): Promise<void> {
  const service = getSeatService();
  await service.toggleReserved(serviceId, seat, reserveType);
}

export async function setRowSeats(serviceId: string, section: SectionName, row: number, occupied: boolean): Promise<void> {
  const service = getSeatService();
  await service.setRowSeats(serviceId, section, row, occupied);
}

export async function setAllSeats(serviceId: string, occupied: boolean): Promise<void> {
  const service = getSeatService();
  await service.setAllSeats(serviceId, occupied);
}

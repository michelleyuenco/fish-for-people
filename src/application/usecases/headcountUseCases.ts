import type { ZoneCounts, HeadcountEntry } from '../../domain/models/Headcount';
import type { SessionName } from '../../domain/constants/sessions';
import { validateHeadcount } from '../../domain/rules/headcountRules';
import { getHeadcountService } from '../../infrastructure/services/ServiceProvider';

export async function upsertHeadcount(
  serviceId: string,
  counterLabel: string,
  session: SessionName,
  counts: ZoneCounts
): Promise<{ success: boolean; errors: string[]; id?: string }> {
  const errors = validateHeadcount(counts);
  if (errors.length > 0) {
    return { success: false, errors };
  }
  const service = getHeadcountService();
  const id = await service.upsertHeadcount(serviceId, counterLabel, session, counts);
  return { success: true, errors: [], id };
}

export async function confirmSessionHeadcount(
  serviceId: string,
  date: string,
  session: SessionName,
  confirmedBy: string,
  counters: HeadcountEntry[],
  officialTotals: ZoneCounts
): Promise<void> {
  const service = getHeadcountService();
  await service.confirmSessionHeadcount(serviceId, date, session, confirmedBy, counters, officialTotals);
}

export async function cleanupDayData(
  serviceId: string,
  date: string
): Promise<void> {
  const service = getHeadcountService();
  await service.deleteAllDayData(serviceId, date);
}

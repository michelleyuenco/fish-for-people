import type { ZoneCounts, HeadcountEntry } from '../../domain/models/Headcount';
import { validateHeadcount, mergeConfirmedCounts } from '../../domain/rules/headcountRules';
import { getHeadcountService } from '../../infrastructure/services/ServiceProvider';

export async function submitHeadcount(
  serviceId: string,
  counterName: string,
  counts: ZoneCounts
): Promise<{ success: boolean; errors: string[]; id?: string }> {
  const errors = validateHeadcount(counts);
  if (errors.length > 0) {
    return { success: false, errors };
  }
  const service = getHeadcountService();
  const id = await service.submitHeadcount(serviceId, counterName, counts);
  return { success: true, errors: [], id };
}

export async function confirmHeadcount(
  serviceId: string,
  date: string,
  entryA: HeadcountEntry,
  entryB: HeadcountEntry
): Promise<void> {
  const service = getHeadcountService();
  const totals = mergeConfirmedCounts(entryA, entryB);
  await service.confirmHeadcount(serviceId, date, entryA, entryB, totals);
}

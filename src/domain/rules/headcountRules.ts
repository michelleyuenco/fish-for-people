import type { HeadcountEntry, ZoneCounts, ZoneName, HeadcountDiscrepancy } from '../models/Headcount';
import { ZONE_NAMES } from '../models/Headcount';

const DISCREPANCY_THRESHOLD = 5;

export function calculateTotal(counts: ZoneCounts): number {
  return counts.left + counts.middle + counts.right + counts.production + counts.outside;
}

export function validateHeadcount(counts: ZoneCounts): string[] {
  const errors: string[] = [];
  const zones: ZoneName[] = ['left', 'middle', 'right', 'production', 'outside'];
  for (const zone of zones) {
    if (counts[zone] < 0) {
      errors.push(`${zone} count cannot be negative`);
    }
    if (!Number.isInteger(counts[zone])) {
      errors.push(`${zone} count must be a whole number`);
    }
  }
  return errors;
}

export function findDiscrepancies(
  entryA: HeadcountEntry | null,
  entryB: HeadcountEntry | null
): HeadcountDiscrepancy[] {
  if (!entryA || !entryB) return [];

  const discrepancies: HeadcountDiscrepancy[] = [];
  for (const { key } of ZONE_NAMES) {
    const countA = entryA.counts[key];
    const countB = entryB.counts[key];
    const diff = Math.abs(countA - countB);
    if (diff > DISCREPANCY_THRESHOLD) {
      discrepancies.push({ zone: key, countA, countB, diff });
    }
  }
  return discrepancies;
}

export function canConfirmHeadcount(
  entryA: HeadcountEntry | null,
  entryB: HeadcountEntry | null
): boolean {
  if (!entryA || !entryB) return false;
  const discrepancies = findDiscrepancies(entryA, entryB);
  return discrepancies.length === 0;
}

export function mergeConfirmedCounts(
  entryA: HeadcountEntry,
  entryB: HeadcountEntry
): ZoneCounts {
  // Average the two counts when confirmed
  return {
    left: Math.round((entryA.counts.left + entryB.counts.left) / 2),
    middle: Math.round((entryA.counts.middle + entryB.counts.middle) / 2),
    right: Math.round((entryA.counts.right + entryB.counts.right) / 2),
    production: Math.round((entryA.counts.production + entryB.counts.production) / 2),
    outside: Math.round((entryA.counts.outside + entryB.counts.outside) / 2),
  };
}

import type { HeadcountEntry, ZoneCounts, HeadcountDiscrepancy, ConfirmedCount } from '../models/Headcount';
import { ZONE_KEYS } from '../models/Headcount';
import type { SessionName } from '../constants/sessions';
import { SESSION_NAMES } from '../constants/sessions';
import { formatSessionTimeRange } from './sessionRules';

const DISCREPANCY_THRESHOLD = 5;

export function calculateTotal(counts: ZoneCounts): number {
  return counts.left + counts.middle + counts.right + counts.production + counts.outside;
}

export function validateHeadcount(counts: ZoneCounts): string[] {
  const errors: string[] = [];
  for (const zone of ZONE_KEYS) {
    if (counts[zone] < 0) {
      errors.push(`${zone} count cannot be negative`);
    }
    if (!Number.isInteger(counts[zone])) {
      errors.push(`${zone} count must be a whole number`);
    }
  }
  return errors;
}

/** Compare two entries and find zones where they differ by more than the threshold. */
export function findDiscrepancies(
  entryA: HeadcountEntry | null,
  entryB: HeadcountEntry | null
): HeadcountDiscrepancy[] {
  if (!entryA || !entryB) return [];

  const discrepancies: HeadcountDiscrepancy[] = [];
  for (const key of ZONE_KEYS) {
    const countA = entryA.counts[key];
    const countB = entryB.counts[key];
    const diff = Math.abs(countA - countB);
    if (diff > DISCREPANCY_THRESHOLD) {
      discrepancies.push({ zone: key, countA, countB, diff });
    }
  }
  return discrepancies;
}

/** Sum zone counts across multiple entries (e.g. across sessions for grand total). */
export function sumZoneCounts(counts: ZoneCounts[]): ZoneCounts {
  const result: ZoneCounts = { left: 0, middle: 0, right: 0, production: 0, outside: 0 };
  for (const c of counts) {
    for (const key of ZONE_KEYS) {
      result[key] += c[key];
    }
  }
  return result;
}

/** Build a formatted full-day summary text for WhatsApp sharing. */
export function buildFullDaySummaryText(
  date: string,
  confirmedCounts: ConfirmedCount[],
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  const sessionEmoji: Record<SessionName, string> = {
    morning: '🌅',
    noon: '🌞',
    afternoon: '🌇',
  };

  const lines: string[] = [
    `📊 ${t('headcount.fullDaySummary')} — ${date}`,
    '',
  ];

  let grandTotal = 0;

  for (const sessionName of SESSION_NAMES) {
    const entry = confirmedCounts.find((c) => c.session === sessionName);
    const emoji = sessionEmoji[sessionName];
    const timeRange = formatSessionTimeRange(sessionName);
    const label = t(`sessions.${sessionName}`);

    lines.push(`${emoji} ${label} (${timeRange})`);

    if (entry) {
      const total = calculateTotal(entry.totals);
      grandTotal += total;
      lines.push(`  ${t('zones.left')}: ${entry.totals.left}  ${t('zones.middle')}: ${entry.totals.middle}  ${t('zones.right')}: ${entry.totals.right}`);
      lines.push(`  ${t('zones.production')}: ${entry.totals.production}  ${t('zones.outside')}: ${entry.totals.outside}  ${t('common.total')}: ${total}`);
    } else {
      lines.push(`  (${t('headcount.noData')})`);
    }
    lines.push('');
  }

  lines.push('═══════════════════════');
  lines.push(`${t('headcount.grandTotal')}: ${grandTotal}`);

  return lines.join('\n');
}

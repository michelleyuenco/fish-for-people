import {
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  type Unsubscribe,
  type Firestore,
} from 'firebase/firestore';
import type { HeadcountEntry, ConfirmedCount, ZoneCounts } from '../../domain/models/Headcount';
import type { SessionName } from '../../domain/constants/sessions';
import { headcountsCollection, confirmedCountsCollection } from '../firebase/collections';
import { sanitizeText } from '../../domain/rules/sanitize';

function firestoreDocToHeadcount(id: string, data: Record<string, unknown>): HeadcountEntry {
  return {
    id,
    counterName: data.counterName as string,
    session: (data.session as SessionName) || 'morning',
    counts: {
      left: (data.left as number) || 0,
      middle: (data.middle as number) || 0,
      right: (data.right as number) || 0,
      production: (data.production as number) || 0,
      outside: (data.outside as number) || 0,
    },
    total: (data.total as number) || 0,
    submittedAt: data.submittedAt
      ? (data.submittedAt as Timestamp).toDate()
      : new Date(),
    updatedAt: data.updatedAt
      ? (data.updatedAt as Timestamp).toDate()
      : new Date(),
  };
}

function entryToFirestore(entry: HeadcountEntry): Record<string, unknown> {
  return {
    counterName: entry.counterName,
    session: entry.session,
    left: entry.counts.left,
    middle: entry.counts.middle,
    right: entry.counts.right,
    production: entry.counts.production,
    outside: entry.counts.outside,
    total: entry.total,
    submittedAt: Timestamp.fromDate(entry.submittedAt),
    updatedAt: Timestamp.fromDate(entry.updatedAt),
  };
}

function firestoreDocToConfirmedCount(id: string, data: Record<string, unknown>): ConfirmedCount {
  const counters = Array.isArray(data.counters)
    ? (data.counters as Record<string, unknown>[]).map((c, i) =>
        firestoreDocToHeadcount(`counter-${i}`, c)
      )
    : [];

  return {
    id,
    date: data.date as string,
    session: (data.session as SessionName) || 'morning',
    counters,
    totals: (data.totals as ZoneCounts) || { left: 0, middle: 0, right: 0, production: 0, outside: 0 },
    confirmedBy: (data.confirmedBy as string) || '',
    confirmedAt: data.confirmedAt
      ? (data.confirmedAt as Timestamp).toDate()
      : null,
  };
}

export class HeadcountService {
  private db: Firestore;
  constructor(db: Firestore) { this.db = db; }

  /**
   * Subscribe to headcount entries for a specific session.
   */
  subscribeToSessionHeadcounts(
    serviceId: string,
    session: SessionName,
    onUpdate: (entries: HeadcountEntry[]) => void,
    onError: (error: Error) => void
  ): Unsubscribe {
    const col = headcountsCollection(this.db, serviceId);
    const q = query(col, where('session', '==', session));
    return onSnapshot(
      q,
      (snapshot) => {
        const entries: HeadcountEntry[] = snapshot.docs.map((d) =>
          firestoreDocToHeadcount(d.id, d.data() as Record<string, unknown>)
        );
        onUpdate(entries);
      },
      (error) => onError(error)
    );
  }

  /**
   * Upsert a headcount entry (auto-save on every count change).
   * Doc ID is deterministic: `{session}-{counterLabel}`.
   */
  async upsertHeadcount(
    serviceId: string,
    counterLabel: string,
    session: SessionName,
    counts: ZoneCounts
  ): Promise<string> {
    const col = headcountsCollection(this.db, serviceId);
    const docId = `${session}-${sanitizeText(counterLabel, 50).toLowerCase().replace(/\s+/g, '-')}`;
    const docRef = doc(col, docId);
    const total = counts.left + counts.middle + counts.right + counts.production + counts.outside;
    await setDoc(docRef, {
      counterName: sanitizeText(counterLabel, 100),
      session,
      left: counts.left,
      middle: counts.middle,
      right: counts.right,
      production: counts.production,
      outside: counts.outside,
      total,
      submittedAt: serverTimestamp(),  // overwritten each time (first save = creation time)
      updatedAt: serverTimestamp(),
    });
    return docId;
  }

  /**
   * Subscribe to confirmed counts history (last 9 = 3 sessions × 3 Sundays).
   */
  subscribeToConfirmedCounts(
    serviceId: string,
    onUpdate: (counts: ConfirmedCount[]) => void,
    onError: (error: Error) => void
  ): Unsubscribe {
    const col = confirmedCountsCollection(this.db, serviceId);
    const q = query(col, orderBy('confirmedAt', 'desc'), limit(9));
    return onSnapshot(
      q,
      (snapshot) => {
        const counts: ConfirmedCount[] = snapshot.docs.map((d) =>
          firestoreDocToConfirmedCount(d.id, d.data() as Record<string, unknown>)
        );
        onUpdate(counts);
      },
      (error) => onError(error)
    );
  }

  /**
   * Save confirmed session attendance. Doc keyed by `{date}-{session}`.
   */
  async confirmSessionHeadcount(
    serviceId: string,
    date: string,
    session: SessionName,
    confirmedBy: string,
    counters: HeadcountEntry[],
    officialTotals: ZoneCounts
  ): Promise<void> {
    const col = confirmedCountsCollection(this.db, serviceId);
    const confirmedDoc = doc(col, `${date}-${session}`);
    await setDoc(confirmedDoc, {
      date,
      session,
      confirmedBy: sanitizeText(confirmedBy, 100),
      counters: counters.map((c) => entryToFirestore(c)),
      totals: {
        left: officialTotals.left,
        middle: officialTotals.middle,
        right: officialTotals.right,
        production: officialTotals.production,
        outside: officialTotals.outside,
      },
      confirmedAt: serverTimestamp(),
    });
  }

  /**
   * Get all confirmed counts for a date (all sessions). Used for full-day summary.
   */
  async getConfirmedCountsForDate(serviceId: string, date: string): Promise<ConfirmedCount[]> {
    const col = confirmedCountsCollection(this.db, serviceId);
    // Query docs whose ID starts with the date prefix
    const q = query(col, where('date', '==', date));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) =>
      firestoreDocToConfirmedCount(d.id, d.data() as Record<string, unknown>)
    );
  }

  /**
   * Delete all raw headcount entries for a session.
   */
  async deleteSessionHeadcounts(serviceId: string, session: SessionName): Promise<void> {
    const col = headcountsCollection(this.db, serviceId);
    const q = query(col, where('session', '==', session));
    const snapshot = await getDocs(q);
    const batch = writeBatch(this.db);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  /**
   * Delete ALL headcount data for the day (raw entries + confirmed counts).
   * Called after user confirms successful WhatsApp share.
   */
  async deleteAllDayData(serviceId: string, date: string): Promise<void> {
    // Delete all raw headcount entries
    const headcountCol = headcountsCollection(this.db, serviceId);
    const allEntries = await getDocs(headcountCol);
    const batch = writeBatch(this.db);
    allEntries.docs.forEach((d) => batch.delete(d.ref));

    // Delete confirmed count docs for this date
    const confirmedCol = confirmedCountsCollection(this.db, serviceId);
    const confirmedQ = query(confirmedCol, where('date', '==', date));
    const confirmedSnapshot = await getDocs(confirmedQ);
    confirmedSnapshot.docs.forEach((d) => batch.delete(d.ref));

    await batch.commit();
  }
}

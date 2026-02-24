import {
  doc,
  addDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
  limit,
  type Unsubscribe,
  type Firestore,
} from 'firebase/firestore';
import type { HeadcountEntry, ConfirmedCount, ZoneCounts } from '../../domain/models/Headcount';
import { headcountsCollection, confirmedCountsCollection } from '../firebase/collections';

function firestoreDocToHeadcount(id: string, data: Record<string, unknown>): HeadcountEntry {
  return {
    id,
    counterName: data.counterName as string,
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
  };
}

function firestoreDocToConfirmedCount(id: string, data: Record<string, unknown>): ConfirmedCount {
  return {
    id,
    date: data.date as string,
    counterA: data.counterA
      ? firestoreDocToHeadcount('counterA', data.counterA as Record<string, unknown>)
      : null,
    counterB: data.counterB
      ? firestoreDocToHeadcount('counterB', data.counterB as Record<string, unknown>)
      : null,
    confirmed: (data.confirmed as boolean) || false,
    totals: (data.totals as ZoneCounts) || null,
    confirmedAt: data.confirmedAt
      ? (data.confirmedAt as Timestamp).toDate()
      : null,
  };
}

export class HeadcountService {
  private db: Firestore;
  constructor(db: Firestore) { this.db = db; }

  /**
   * Subscribe to headcount entries for a service.
   */
  subscribeToHeadcounts(
    serviceId: string,
    onUpdate: (entries: HeadcountEntry[]) => void,
    onError: (error: Error) => void
  ): Unsubscribe {
    const col = headcountsCollection(this.db, serviceId);
    return onSnapshot(
      col,
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
   * Subscribe to confirmed counts history (last 3).
   */
  subscribeToConfirmedCounts(
    serviceId: string,
    onUpdate: (counts: ConfirmedCount[]) => void,
    onError: (error: Error) => void
  ): Unsubscribe {
    const col = confirmedCountsCollection(this.db, serviceId);
    const q = query(col, orderBy('confirmedAt', 'desc'), limit(3));
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
   * Submit a headcount entry.
   */
  async submitHeadcount(
    serviceId: string,
    counterName: string,
    counts: ZoneCounts
  ): Promise<string> {
    const col = headcountsCollection(this.db, serviceId);
    const total = counts.left + counts.middle + counts.right + counts.production + counts.outside;
    const docRef = await addDoc(col, {
      counterName,
      left: counts.left,
      middle: counts.middle,
      right: counts.right,
      production: counts.production,
      outside: counts.outside,
      total,
      submittedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  /**
   * Save confirmed attendance to Firestore.
   */
  async confirmHeadcount(
    serviceId: string,
    date: string,
    counterA: HeadcountEntry,
    counterB: HeadcountEntry,
    totals: ZoneCounts
  ): Promise<void> {
    const col = confirmedCountsCollection(this.db, serviceId);
    const confirmedDoc = doc(col, date);
    await setDoc(confirmedDoc, {
      date,
      counterA: {
        counterName: counterA.counterName,
        left: counterA.counts.left,
        middle: counterA.counts.middle,
        right: counterA.counts.right,
        production: counterA.counts.production,
        outside: counterA.counts.outside,
        total: counterA.total,
        submittedAt: counterA.submittedAt,
      },
      counterB: {
        counterName: counterB.counterName,
        left: counterB.counts.left,
        middle: counterB.counts.middle,
        right: counterB.counts.right,
        production: counterB.counts.production,
        outside: counterB.counts.outside,
        total: counterB.total,
        submittedAt: counterB.submittedAt,
      },
      confirmed: true,
      totals: {
        left: totals.left,
        middle: totals.middle,
        right: totals.right,
        production: totals.production,
        outside: totals.outside,
      },
      confirmedAt: serverTimestamp(),
    });
  }
}

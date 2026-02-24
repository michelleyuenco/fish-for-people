import {
  collection,
  doc,
  type Firestore,
  type CollectionReference,
  type DocumentReference,
} from 'firebase/firestore';

// Collection path constants
export const COLLECTIONS = {
  CONFIG: 'config',
  SERVICES: 'services',
  SEATS: 'seats',
  REQUESTS: 'requests',
  HEADCOUNTS: 'headcounts',
  CONFIRMED_COUNTS: 'confirmedCounts',
} as const;

// Typed collection references
export function seatsCollection(db: Firestore, serviceId: string): CollectionReference {
  return collection(db, COLLECTIONS.SERVICES, serviceId, COLLECTIONS.SEATS);
}

export function requestsCollection(db: Firestore, serviceId: string): CollectionReference {
  return collection(db, COLLECTIONS.SERVICES, serviceId, COLLECTIONS.REQUESTS);
}

export function headcountsCollection(db: Firestore, serviceId: string): CollectionReference {
  return collection(db, COLLECTIONS.SERVICES, serviceId, COLLECTIONS.HEADCOUNTS);
}

export function confirmedCountsCollection(db: Firestore, serviceId: string): CollectionReference {
  return collection(db, COLLECTIONS.SERVICES, serviceId, COLLECTIONS.CONFIRMED_COUNTS);
}

export function activeConfigDoc(db: Firestore): DocumentReference {
  return doc(db, COLLECTIONS.CONFIG, 'active');
}

import {
  doc,
  addDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Timestamp,
  type Unsubscribe,
  type Firestore,
} from 'firebase/firestore';
import type { ServiceRequest, RequestType, RequestStatus } from '../../domain/models/Request';
import type { SectionName } from '../../domain/models/Seat';
import { requestsCollection } from '../firebase/collections';
import { sanitizeText, sanitizePhone } from '../../domain/rules/sanitize';

function firestoreDocToRequest(id: string, data: Record<string, unknown>): ServiceRequest {
  return {
    id,
    section: data.section as SectionName,
    row: data.row as number,
    areaLabel: data.areaLabel ? (data.areaLabel as string) : undefined,
    type: data.type as RequestType,
    quantity: typeof data.quantity === 'number' ? data.quantity : 1,
    note: (data.note as string) || '',
    contactName: data.contactName ? (data.contactName as string) : undefined,
    contactPhone: data.contactPhone ? (data.contactPhone as string) : undefined,
    status: data.status as RequestStatus,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    resolvedAt: data.resolvedAt ? (data.resolvedAt as Timestamp).toDate() : null,
  };
}

export class RequestService {
  private db: Firestore;
  constructor(db: Firestore) { this.db = db; }

  subscribeToRequests(
    serviceId: string,
    onUpdate: (requests: ServiceRequest[]) => void,
    onError: (error: Error) => void
  ): Unsubscribe {
    const col = requestsCollection(this.db, serviceId);
    return onSnapshot(
      col,
      (snapshot) => {
        const requests: ServiceRequest[] = snapshot.docs.map((d) =>
          firestoreDocToRequest(d.id, d.data() as Record<string, unknown>)
        );
        onUpdate(requests);
      },
      (error) => onError(error)
    );
  }

  async submitRequest(
    serviceId: string,
    payload: {
      section: SectionName;
      row: number;
      areaLabel?: string;
      type: RequestType;
      quantity: number;
      note: string;
      contactName?: string;
      contactPhone?: string;
    }
  ): Promise<string> {
    const col = requestsCollection(this.db, serviceId);
    const note = sanitizeText(payload.note);
    const contactName = payload.contactName ? sanitizeText(payload.contactName, 100) : undefined;
    const contactPhone = payload.contactPhone ? sanitizePhone(payload.contactPhone) : undefined;
    const docRef = await addDoc(col, {
      section: payload.section,
      row: payload.row,
      ...(payload.areaLabel ? { areaLabel: sanitizeText(payload.areaLabel, 100) } : {}),
      type: payload.type,
      quantity: payload.quantity,
      note,
      ...(contactName ? { contactName } : {}),
      ...(contactPhone ? { contactPhone } : {}),
      status: 'pending' as RequestStatus,
      createdAt: serverTimestamp(),
      resolvedAt: null,
    });
    return docRef.id;
  }

  async resolveRequest(serviceId: string, requestId: string): Promise<void> {
    const col = requestsCollection(this.db, serviceId);
    const requestDoc = doc(col, requestId);
    await updateDoc(requestDoc, {
      status: 'resolved' as RequestStatus,
      resolvedAt: serverTimestamp(),
    });
  }

  async deleteAllRequests(serviceId: string): Promise<void> {
    const col = requestsCollection(this.db, serviceId);
    const snapshot = await getDocs(col);
    const BATCH_SIZE = 500;
    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = writeBatch(this.db);
      const chunk = docs.slice(i, i + BATCH_SIZE);
      for (const d of chunk) {
        batch.delete(d.ref);
      }
      await batch.commit();
    }
  }
}

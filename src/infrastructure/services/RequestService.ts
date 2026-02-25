import {
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
  type Firestore,
} from 'firebase/firestore';
import type { ServiceRequest, RequestType, RequestStatus } from '../../domain/models/Request';
import type { SectionName } from '../../domain/models/Seat';
import { requestsCollection } from '../firebase/collections';

function firestoreDocToRequest(id: string, data: Record<string, unknown>): ServiceRequest {
  return {
    id,
    section: data.section as SectionName,
    row: data.row as number,
    areaLabel: data.areaLabel ? (data.areaLabel as string) : undefined,
    type: data.type as RequestType,
    note: (data.note as string) || '',
    status: data.status as RequestStatus,
    createdAt: data.createdAt
      ? (data.createdAt as Timestamp).toDate()
      : new Date(),
    resolvedAt: data.resolvedAt
      ? (data.resolvedAt as Timestamp).toDate()
      : null,
  };
}

export class RequestService {
  private db: Firestore;
  constructor(db: Firestore) { this.db = db; }

  /**
   * Subscribe to real-time request updates for a service.
   */
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

  /**
   * Submit a new request to Firestore.
   */
  async submitRequest(
    serviceId: string,
    payload: {
      section: SectionName;
      row: number;
      areaLabel?: string;
      type: RequestType;
      note: string;
    }
  ): Promise<string> {
    const col = requestsCollection(this.db, serviceId);
    const docRef = await addDoc(col, {
      section: payload.section,
      row: payload.row,
      ...(payload.areaLabel ? { areaLabel: payload.areaLabel } : {}),
      type: payload.type,
      note: payload.note,
      status: 'pending' as RequestStatus,
      createdAt: serverTimestamp(),
      resolvedAt: null,
    });
    return docRef.id;
  }

  /**
   * Mark a request as resolved.
   */
  async resolveRequest(serviceId: string, requestId: string): Promise<void> {
    const col = requestsCollection(this.db, serviceId);
    const requestDoc = doc(col, requestId);
    await updateDoc(requestDoc, {
      status: 'resolved' as RequestStatus,
      resolvedAt: serverTimestamp(),
    });
  }
}

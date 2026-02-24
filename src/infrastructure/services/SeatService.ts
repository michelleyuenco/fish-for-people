import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
  type Firestore,
} from 'firebase/firestore';
import type { Seat, SectionName } from '../../domain/models/Seat';
import { seatsCollection } from '../firebase/collections';

function firestoreDocToSeat(id: string, data: Record<string, unknown>): Seat {
  return {
    id,
    section: data.section as SectionName,
    row: data.row as number,
    col: data.col as number,
    occupied: data.occupied as boolean,
    updatedAt: data.updatedAt ? (data.updatedAt as { toDate(): Date }).toDate() : null,
  };
}

export class SeatService {
  private db: Firestore;
  constructor(db: Firestore) { this.db = db; }

  /**
   * Subscribe to real-time seat updates for a service.
   * Returns an unsubscribe function.
   */
  subscribeToSeats(
    serviceId: string,
    onUpdate: (seats: Seat[]) => void,
    onError: (error: Error) => void
  ): Unsubscribe {
    const col = seatsCollection(this.db, serviceId);
    return onSnapshot(
      col,
      (snapshot) => {
        const seats: Seat[] = snapshot.docs.map((d) =>
          firestoreDocToSeat(d.id, d.data() as Record<string, unknown>)
        );
        onUpdate(seats);
      },
      (error) => onError(error)
    );
  }

  /**
   * Toggle a seat's occupied state and persist to Firestore.
   */
  async toggleSeat(
    serviceId: string,
    seat: Seat
  ): Promise<void> {
    const col = seatsCollection(this.db, serviceId);
    const seatDoc = doc(col, seat.id);
    await setDoc(seatDoc, {
      section: seat.section,
      row: seat.row,
      col: seat.col,
      occupied: !seat.occupied,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Set a seat's state explicitly.
   */
  async setSeat(
    serviceId: string,
    seat: Seat,
    occupied: boolean
  ): Promise<void> {
    const col = seatsCollection(this.db, serviceId);
    const seatDoc = doc(col, seat.id);
    await setDoc(seatDoc, {
      section: seat.section,
      row: seat.row,
      col: seat.col,
      occupied,
      updatedAt: serverTimestamp(),
    });
  }
}

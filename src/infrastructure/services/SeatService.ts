import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  type Unsubscribe,
  type Firestore,
} from 'firebase/firestore';
import type { Seat, SectionName, ReservedFor } from '../../domain/models/Seat';
import { SECTIONS } from '../../domain/constants/seating';
import { seatsCollection } from '../firebase/collections';

function firestoreDocToSeat(id: string, data: Record<string, unknown>): Seat {
  return {
    id,
    section: data.section as SectionName,
    row: data.row as number,
    col: data.col as number,
    occupied: data.occupied as boolean,
    reservedFor: (data.reservedFor as ReservedFor) ?? (data.reserved ? 'family' : 'none'),
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
      reservedFor: seat.reservedFor ?? 'none',
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Toggle a seat's reservation (family / volunteer).
   * If the seat is already reserved for the given type, unreserve it.
   * Otherwise, set it to the given type.
   */
  async toggleReserved(
    serviceId: string,
    seat: Seat,
    reserveType: ReservedFor
  ): Promise<void> {
    const col = seatsCollection(this.db, serviceId);
    const seatDoc = doc(col, seat.id);
    const newReservedFor = seat.reservedFor === reserveType ? 'none' : reserveType;
    await setDoc(seatDoc, {
      section: seat.section,
      row: seat.row,
      col: seat.col,
      occupied: seat.occupied,
      reservedFor: newReservedFor,
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
      reservedFor: seat.reservedFor ?? 'none',
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Set all seats to occupied or available in batches.
   * Firestore batches are limited to 500 writes each.
   */
  async setAllSeats(serviceId: string, occupied: boolean): Promise<void> {
    const col = seatsCollection(this.db, serviceId);
    const allSeats: { id: string; section: SectionName; row: number; col: number }[] = [];

    for (const section of SECTIONS) {
      for (let row = 1; row <= section.rows; row++) {
        const seatsInRow = section.seatsPerRow(row);
        for (let c = 1; c <= seatsInRow; c++) {
          allSeats.push({ id: `${section.name}-${row}-${c}`, section: section.name, row, col: c });
        }
      }
    }

    // Firestore batch limit is 500
    const BATCH_SIZE = 500;
    for (let i = 0; i < allSeats.length; i += BATCH_SIZE) {
      const batch = writeBatch(this.db);
      const chunk = allSeats.slice(i, i + BATCH_SIZE);
      for (const seat of chunk) {
        const seatDoc = doc(col, seat.id);
        batch.set(seatDoc, {
          section: seat.section,
          row: seat.row,
          col: seat.col,
          occupied,
          reservedFor: 'none',
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }
  }
}

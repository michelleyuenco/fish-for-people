import { getFirestoreDb } from '../firebase/firebaseConfig';
import { SeatService } from './SeatService';
import { RequestService } from './RequestService';
import { HeadcountService } from './HeadcountService';

// Singleton service instances
let seatService: SeatService | null = null;
let requestService: RequestService | null = null;
let headcountService: HeadcountService | null = null;

export function getSeatService(): SeatService {
  if (!seatService) {
    seatService = new SeatService(getFirestoreDb());
  }
  return seatService;
}

export function getRequestService(): RequestService {
  if (!requestService) {
    requestService = new RequestService(getFirestoreDb());
  }
  return requestService;
}

export function getHeadcountService(): HeadcountService {
  if (!headcountService) {
    headcountService = new HeadcountService(getFirestoreDb());
  }
  return headcountService;
}

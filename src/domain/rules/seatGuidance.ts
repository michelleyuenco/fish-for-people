import type { Seat, SectionName } from '../models/Seat';
import { SECTIONS } from '../constants/seating';

/**
 * Compute the set of "recommended" seat IDs — available seats that,
 * if filled first, keep aisles accessible for latecomers.
 *
 * Fill strategy per section:
 *   Left:   fill from left edge → right (keep right aisle open)
 *   Middle: fill from center → outward (keep both aisles open)
 *   Right:  fill from right edge → left (keep left aisle open)
 *
 * For each row we recommend up to `perRow` of the next best available seats.
 */
export function getRecommendedSeats(
  seatMap: Map<string, Seat>,
  perRow = 3,
): Set<string> {
  const recommended = new Set<string>();

  for (const section of SECTIONS) {
    // Skip row 1 — front row has ample space, no guidance needed
    for (let row = 2; row <= section.rows; row++) {
      const seatsInRow = section.seatsPerRow(row);
      const colOrder = getColFillOrder(section.name, seatsInRow);

      let count = 0;
      for (const col of colOrder) {
        if (count >= perRow) break;
        const seatId = `${section.name}-${row}-${col}`;
        const seat = seatMap.get(seatId);
        const isAvailable = !seat || (!seat.occupied && seat.reservedFor === 'none');
        if (isAvailable) {
          recommended.add(seatId);
          count++;
        }
      }
    }
  }

  return recommended;
}

/**
 * Returns column numbers in preferred fill order for a given section.
 */
function getColFillOrder(section: SectionName, seatsInRow: number): number[] {
  const cols = Array.from({ length: seatsInRow }, (_, i) => i + 1);

  switch (section) {
    case 'left':
      // Fill from left edge (col 1) → right
      return cols;

    case 'right':
      // Fill from right edge (max col) → left
      return cols.slice().reverse();

    case 'middle':
      // Fill from center outward
      return centerOutward(cols);

    default:
      return cols;
  }
}

/** Sort columns from center outward: [7, 6, 8, 5, 9, 4, 10, ...] */
function centerOutward(cols: number[]): number[] {
  const center = (cols.length + 1) / 2; // e.g. 7 for 13 seats
  return cols.slice().sort((a, b) => {
    const distA = Math.abs(a - center);
    const distB = Math.abs(b - center);
    if (distA !== distB) return distA - distB;
    return a - b; // tie-break: prefer left of center
  });
}

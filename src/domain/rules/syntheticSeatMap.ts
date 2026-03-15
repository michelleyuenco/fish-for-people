import type { Seat, SectionName } from '../models/Seat';
import { SECTIONS, REGIONS, getSeatId, type RegionConfig } from '../constants/seating';
import { getColFillOrder } from './seatGuidance';

export type RegionAvailability = Record<string, number>;

/**
 * Simple seeded PRNG (mulberry32) for deterministic randomisation.
 * Returns a function that produces values in [0, 1).
 */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Collect all seat IDs within a region, ordered by fill preference.
 * For each row, seats come in fill-direction order (wall→aisle for L/R, center→out for M).
 */
function getRegionSeatIds(region: RegionConfig): string[] {
  const sectionConfig = SECTIONS.find((s) => s.name === region.section)!;
  const ids: string[] = [];
  for (let row = region.startRow; row <= region.endRow; row++) {
    if (row > sectionConfig.rows) break;
    const seatsInRow = sectionConfig.seatsPerRow(row);
    const colOrder = getColFillOrder(region.section, seatsInRow);
    for (const col of colOrder) {
      ids.push(getSeatId(region.section, row, col));
    }
  }
  return ids;
}

/**
 * Build a synthetic seat map from regional availability counts.
 *
 * All seats default to occupied. For each region, the given number of available
 * seats are selected using a preference-weighted random distribution:
 * preferred seats (per fill order) are more likely to be picked as available.
 *
 * @param availability  regionId → number of available seats
 * @param seed          optional seed for deterministic randomisation
 */
export function buildSyntheticSeatMap(
  availability: RegionAvailability,
  seed: number = Date.now(),
): Map<string, Seat> {
  const seatMap = new Map<string, Seat>();
  const rand = mulberry32(seed);

  // Initialise all seats as occupied
  for (const section of SECTIONS) {
    for (let row = 1; row <= section.rows; row++) {
      const seatsInRow = section.seatsPerRow(row);
      for (let col = 1; col <= seatsInRow; col++) {
        const id = getSeatId(section.name, row, col);
        seatMap.set(id, {
          id,
          section: section.name as SectionName,
          row,
          col,
          occupied: true,
          reservedFor: 'none',
          updatedAt: null,
        });
      }
    }
  }

  // For each region, randomly mark N seats as available
  for (const region of REGIONS) {
    const count = Math.max(0, availability[region.id] ?? 0);
    if (count === 0) continue;

    const seatIds = getRegionSeatIds(region);
    const totalInRegion = seatIds.length;
    const availableCount = Math.min(count, totalInRegion);

    // Weighted selection: seats earlier in fill order are more likely to be chosen.
    // We assign weights and use weighted sampling without replacement.
    const weights = seatIds.map((_, i) => {
      // Weight decays linearly: first seat gets weight 1.0, last gets 0.3
      return 0.3 + 0.7 * (1 - i / Math.max(totalInRegion - 1, 1));
    });

    const selected = new Set<number>();
    for (let n = 0; n < availableCount; n++) {
      // Calculate remaining weight sum
      let totalWeight = 0;
      for (let i = 0; i < seatIds.length; i++) {
        if (!selected.has(i)) totalWeight += weights[i];
      }
      // Pick a random point
      let pick = rand() * totalWeight;
      for (let i = 0; i < seatIds.length; i++) {
        if (selected.has(i)) continue;
        pick -= weights[i];
        if (pick <= 0) {
          selected.add(i);
          break;
        }
      }
    }

    for (const idx of selected) {
      const seat = seatMap.get(seatIds[idx]);
      if (seat) {
        seatMap.set(seat.id, { ...seat, occupied: false });
      }
    }
  }

  return seatMap;
}

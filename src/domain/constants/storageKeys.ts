/**
 * Centralized localStorage key definitions.
 * All keys use the 'fish-for-people:' namespace to avoid collisions.
 */
export const STORAGE_KEYS = {
  ROLE: 'fish-for-people:role',
  LANGUAGE: 'fish-for-people:lang',
  LARGE_TEXT: 'fish-for-people:large-text',
  HANDEDNESS: 'fish-for-people:handedness',
  LAST_LOCATION: 'fish-for-people:last-location-v2',
  HEADCOUNT_COUNTS: 'fish-for-people:headcount-counts',
  HEADCOUNT_ADJ: 'fish-for-people:headcount-adj',
  HEADCOUNT_MODE: 'fish-for-people:headcount-mode',
} as const;

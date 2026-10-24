/**
 * When waiting riders should be grouped.
 *
 * Two or more people are formed once the newest of them has been waiting
 * PAIR_SETTLE_MS. That short pause lets people stepping off the same train
 * join one auto, and it is the debounce between polls.
 * One person with nobody else waiting becomes a solo auto after SOLO_SETTLE_MS
 * so the waiting screen does not sit there forever.
 */

export const PAIR_SETTLE_MS = 8_000;
export const SOLO_SETTLE_MS = 60_000;

export type SettleInput = {
  count: number;
  /** How long the most recently joined waiting rider has been waiting. */
  newestAgeMs: number;
  /** How long the longest-waiting rider has been waiting. */
  oldestAgeMs: number;
};

export function settleAges(ageMs: readonly number[]): SettleInput {
  if (ageMs.length === 0) return { count: 0, newestAgeMs: 0, oldestAgeMs: 0 };
  let newest = ageMs[0];
  let oldest = ageMs[0];
  for (const age of ageMs) {
    if (age < newest) newest = age;
    if (age > oldest) oldest = age;
  }
  return { count: ageMs.length, newestAgeMs: newest, oldestAgeMs: oldest };
}

export function formingReady(input: SettleInput): boolean {
  if (input.count <= 0) return false;
  if (input.count === 1) return input.oldestAgeMs >= SOLO_SETTLE_MS;
  return input.newestAgeMs >= PAIR_SETTLE_MS;
}

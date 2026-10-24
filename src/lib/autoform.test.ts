import { describe, expect, it } from "vitest";
import { PAIR_SETTLE_MS, SOLO_SETTLE_MS, formingReady, settleAges } from "./autoform";

describe("formingReady", () => {
  it("does not form an empty room", () => {
    expect(formingReady(settleAges([]))).toBe(false);
  });

  it("waits with a single fresh rider and forms them solo after a minute", () => {
    expect(formingReady({ count: 1, newestAgeMs: 1_000, oldestAgeMs: 1_000 })).toBe(false);
    expect(formingReady({ count: 1, newestAgeMs: SOLO_SETTLE_MS - 1, oldestAgeMs: SOLO_SETTLE_MS - 1 })).toBe(false);
    expect(formingReady({ count: 1, newestAgeMs: SOLO_SETTLE_MS, oldestAgeMs: SOLO_SETTLE_MS })).toBe(true);
  });

  it("waits until the newest of two riders has settled, then forms", () => {
    expect(formingReady({ count: 2, newestAgeMs: PAIR_SETTLE_MS - 1, oldestAgeMs: 30_000 })).toBe(false);
    expect(formingReady({ count: 2, newestAgeMs: PAIR_SETTLE_MS, oldestAgeMs: 30_000 })).toBe(true);
  });

  it("reads newest and oldest from the ages", () => {
    expect(settleAges([30_000, 1_000, 12_000])).toEqual({
      count: 3,
      newestAgeMs: 1_000,
      oldestAgeMs: 30_000,
    });
  });
});

import { describe, expect, it } from "vitest";
import { splitFare, tariff } from "./fare";

/** Instants given in UTC; IST = UTC + 5:30. */
const NOON_IST = new Date("2026-10-24T06:30:00Z");
const ONE_AM_IST = new Date("2026-10-23T19:30:00Z");
const FIVE_AM_IST = new Date("2026-10-23T23:30:00Z");
const FOUR_59_IST = new Date("2026-10-23T23:29:00Z");

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("tariff", () => {
  it("charges the ₹30 minimum up to 1.5 km", () => {
    expect(tariff(1.0, NOON_IST)).toBe(30);
    expect(tariff(1.5, NOON_IST)).toBe(30);
    expect(tariff(0, NOON_IST)).toBe(30);
  });

  it("adds ₹20 per km after 1.5 km, rounded to the rupee", () => {
    expect(tariff(2.0, NOON_IST)).toBe(40);
    expect(tariff(6.3, NOON_IST)).toBe(126);
    expect(tariff(1.52, NOON_IST)).toBe(30); // 30.4
    expect(tariff(1.53, NOON_IST)).toBe(31); // 30.6
  });

  it("applies ×1.25 at 01:00 IST", () => {
    expect(tariff(1.0, ONE_AM_IST)).toBe(38); // 37.5
    expect(tariff(2.0, ONE_AM_IST)).toBe(50);
    expect(tariff(6.3, ONE_AM_IST)).toBe(158); // 157.5
    expect(tariff(1.7, ONE_AM_IST)).toBe(43); // 42.5, despite float noise in 1.7 - 1.5
  });

  it("has no multiplier from 05:00 IST, and still has it at 04:59 IST", () => {
    expect(tariff(2.0, FIVE_AM_IST)).toBe(40);
    expect(tariff(6.3, FIVE_AM_IST)).toBe(126);
    expect(tariff(2.0, FOUR_59_IST)).toBe(50);
  });

  it("rejects invalid input", () => {
    expect(() => tariff(Number.NaN, NOON_IST)).toThrow(RangeError);
    expect(() => tariff(-1, NOON_IST)).toThrow(RangeError);
    expect(() => tariff(2, new Date("nope"))).toThrow(RangeError);
  });
});

describe("splitFare", () => {
  it("floors proportional shares and gives the remainder to the largest solo fare", () => {
    // 52 × [30, 36, 52] / 118 = [13.2, 15.9, 22.9] → [13, 15, 22] + 2
    expect(splitFare(52, [30, 36, 52])).toEqual([13, 15, 24]);
    expect(splitFare(40, [40])).toEqual([40]);
  });

  it("breaks a largest-fare tie by lowest index", () => {
    expect(splitFare(61, [40, 40])).toEqual([31, 30]);
    expect(splitFare(100, [30, 50, 50])).toEqual([23, 39, 38]);
  });

  it("always sums exactly to the total (seeded property test)", () => {
    const rand = mulberry32(20261024);
    for (let n = 0; n < 5000; n++) {
      const size = 1 + Math.floor(rand() * 3);
      const fares = Array.from({ length: size }, () => 30 + Math.floor(rand() * 300));
      const total = Math.floor(rand() * 600);
      const shares = splitFare(total, fares);
      expect(shares.reduce((a, b) => a + b, 0)).toBe(total);
      const sum = fares.reduce((a, b) => a + b, 0);
      const largest = fares.indexOf(Math.max(...fares));
      shares.forEach((s, i) => {
        expect(Number.isInteger(s)).toBe(true);
        const floor = Math.floor((total * fares[i]) / sum);
        expect(s).toBe(i === largest ? total - shares.reduce((a, b, j) => (j === i ? a : a + b), 0) : floor);
        expect(s).toBeGreaterThanOrEqual(floor);
        expect(s - floor).toBeLessThan(size);
      });
    }
  });
});

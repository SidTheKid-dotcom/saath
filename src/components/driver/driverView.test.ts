import { describe, expect, it } from "vitest";
import type { StoredGroup } from "../../lib/types";
import { driverStops, groupTotal, newestFirst } from "./driverView";

const data: StoredGroup["data"] = {
  riderIds: ["b", "a"],
  totalKm: 3.6,
  estimated: false,
  perRider: [
    { id: "a", soloKm: 3.1, rideKm: 3.6, soloFare: 62, share: 41, destText: "Datta Mandir" },
    { id: "b", soloKm: 2.4, rideKm: 2, soloFare: 48, share: 31, destText: "  " },
  ],
  meetAt: "Gate 2",
} as unknown as StoredGroup["data"];

describe("driver group formatting", () => {
  it("lists stops in drop order with no phones", () => {
    const stops = driverStops(data);
    expect(stops.map((s) => s.id)).toEqual(["b", "a"]);
    expect(stops[0].place).toBeNull();
    expect(stops[1].place).toBe("Datta Mandir");
    expect(stops.every((s) => !("phone" in s))).toBe(true);
  });

  it("total fare is the sum of shares", () => {
    expect(groupTotal(data)).toBe(72);
  });

  it("sorts newest first", () => {
    const g = (id: string, createdAt: string) => ({ id, station: "x", createdAt, data }) as StoredGroup;
    expect(newestFirst([g("old", "2026-10-24T09:00:00Z"), g("new", "2026-10-24T10:00:00Z")]).map((x) => x.id)).toEqual([
      "new",
      "old",
    ]);
  });
});

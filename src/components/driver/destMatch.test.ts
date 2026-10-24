import { describe, expect, it } from "vitest";
import type { StoredGroup } from "../../lib/types";
import { destChips, matchGroups } from "./destMatch";

const station = { lat: 18.55, lon: 73.9 };
const group = (id: string, drops: Array<[number, number]>): StoredGroup =>
  ({
    id,
    station: "x",
    createdAt: "2026-10-24T07:00:00Z",
    data: {
      riderIds: drops.map((_, i) => `${id}${i}`),
      totalKm: 3,
      legKm: [],
      estimated: false,
      meetAt: "Gate 1",
      perRider: drops.map(([lat, lon], i) => ({ id: `${id}${i}`, soloKm: 1, rideKm: 1, soloFare: 30, share: 30, lat, lon, destText: `${id}${i} place, Pune` })),
    },
  }) as StoredGroup;

describe("matchGroups", () => {
  const dest = { lat: 18.6, lon: 73.9 }; // due north
  it("keeps in-cone groups and drops the opposite direction", () => {
    const north = group("n", [[18.57, 73.905], [18.58, 73.9]]);
    const south = group("s", [[18.5, 73.9]]);
    expect(matchGroups([north, south], station, dest).map((m) => m.group.id)).toEqual(["n"]);
  });
  it("sorts by distance from the last drop, closest first", () => {
    const far = group("far", [[18.56, 73.9]]);
    const near = group("near", [[18.56, 73.9], [18.595, 73.9]]);
    const out = matchGroups([far, near], station, dest);
    expect(out.map((m) => m.group.id)).toEqual(["near", "far"]);
    expect(out[0].lastKm).toBeLessThan(out[1].lastKm);
  });
  it("builds distinct chips", () => {
    expect(destChips([group("a", [[18.56, 73.9]])]).map((c) => c.label)).toEqual(["a0 place"]);
  });
});

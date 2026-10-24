import { bearingDeg, haversineKm } from "../../lib/distance";
import type { Point, StoredGroup } from "../../lib/types";

export const CONE_DEG = 45;

export type Matched = { group: StoredGroup; lastKm: number };

const angleGap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

function drops(group: StoredGroup): Point[] {
  return group.data.riderIds
    .map((id) => group.data.perRider.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> & Point => typeof m?.lat === "number" && typeof m?.lon === "number")
    .map((m) => ({ lat: m.lat, lon: m.lon }));
}

/**
 * Groups heading the driver's way: every drop point within CONE_DEG of the driver's destination
 * as seen from the station. Closest last drop to the destination first.
 */
export function matchGroups(groups: StoredGroup[], station: Point, dest: Point): Matched[] {
  const want = bearingDeg(station, dest);
  const out: Matched[] = [];
  for (const group of groups) {
    const points = drops(group);
    if (points.length === 0) continue;
    if (!points.every((p) => angleGap(bearingDeg(station, p), want) <= CONE_DEG)) continue;
    out.push({ group, lastKm: Math.round(haversineKm(points[points.length - 1], dest) * 10) / 10 });
  }
  return out.sort((a, b) => a.lastKm - b.lastKm);
}

/** Quick chips: distinct drop places of the current groups that have coordinates. */
export function destChips(groups: StoredGroup[]): Array<Point & { label: string }> {
  const seen = new Map<string, Point & { label: string }>();
  for (const g of groups) {
    for (const m of g.data.perRider) {
      const label = m.destText?.split(",")[0].trim();
      if (label && typeof m.lat === "number" && typeof m.lon === "number" && !seen.has(label)) {
        seen.set(label, { label, lat: m.lat, lon: m.lon });
      }
    }
  }
  return [...seen.values()].slice(0, 6);
}

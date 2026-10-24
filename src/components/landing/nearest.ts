import { stations } from "../../lib/stations";
import { haversineKm } from "../../lib/distance";
import type { Point, Station } from "../../lib/types";

/** Beyond this straight-line distance no Pune Metro station is "near" (km). */
export const NEAR_LIMIT_KM = 25;

export function nearestStation(here: Point): { station: Station; km: number } {
  let best = stations[0];
  let bestKm = Infinity;
  for (const station of stations) {
    const km = haversineKm(here, station);
    if (km < bestKm) {
      best = station;
      bestKm = km;
    }
  }
  return { station: best, km: bestKm };
}

/** Case-insensitive match on a station's name or any alias. */
export function matchesQuery(name: string, aliases: string[], query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [name, ...aliases].some((n) => n.toLowerCase().includes(q));
}

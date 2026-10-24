import { haversineKm } from "../../lib/distance";
import { stations } from "../../lib/stations";
import type { Station } from "../../lib/types";

const MIN_CHARS = 2;
const MAX_METRO = 3;

/** Metro stations whose name matches the query: local and instant. The start station is left out. */
export function metroMatches(q: string, from: string, list: Station[] = stations): Station[] {
  const needle = q.trim().toLowerCase();
  if (needle.length < MIN_CHARS) return [];
  return list
    .filter((s) => s.slug !== from)
    .filter((s) => {
      const name = s.name.toLowerCase();
      return name.split(/[\s-]+/).some((word) => word.startsWith(needle)) || (needle.length >= 3 && name.includes(needle));
    })
    .slice(0, MAX_METRO);
}

/** Nearest other Metro stations, so a rider can tap instead of typing. */
export function nearbyMetros(from: string, list: Station[] = stations, limit = 4): Station[] {
  const here = list.find((station) => station.slug === from);
  if (!here) return [];
  return list
    .filter((station) => station.slug !== from)
    .map((station) => ({ station, km: haversineKm(here, station) }))
    .sort((a, b) => a.km - b.km || a.station.name.localeCompare(b.station.name))
    .slice(0, limit)
    .map((item) => item.station);
}

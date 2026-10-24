import type { Station } from "./types";

/** Station points and exits from OpenStreetMap, read 2026-10-24. */
export const stations: Station[] = [
  {
    slug: "ramwadi",
    name: "Ramwadi",
    lat: 18.55703,
    lon: 73.90856,
    exits: [
      { label: "Gate 2", lat: 18.55761, lon: 73.90907 },
      { label: "Gate 3", lat: 18.55727, lon: 73.90928 },
    ],
  },
  {
    slug: "vanaz",
    name: "Vanaz",
    lat: 18.50719,
    lon: 73.80519,
    exits: [{ label: "Station exit", lat: 18.50719, lon: 73.80519 }],
  },
];

export function getStation(slug: string): Station | null {
  return stations.find((station) => station.slug === slug) ?? null;
}

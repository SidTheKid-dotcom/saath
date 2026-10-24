import type { Station } from "./types";

/**
 * Station points and exits from OpenStreetMap, read 2026-10-24.
 * Source: Overpass API, bbox 18.40,73.70,18.70,74.05:
 *   nwr[railway=station][station~"subway|light_rail"]; nwr[public_transport=station][subway=yes];
 *   nwr[railway=subway_entrance]
 * Operational Line 1 (Purple) and Line 2 (Aqua) only; Line 3 and the Nigdi
 * extension are tagged as under construction or proposed in OSM and left out.
 * Exits are entrances tagged ref=N or name="Gate N" within 200 m of the station;
 * a station with none gets one "Station exit" at the station point.
 */
export const stations: Station[] = [
  {
    slug: "pcmc",
    name: "PCMC",
    lat: 18.62932,
    lon: 73.80329,
    exits: [
      { label: "Station exit", lat: 18.62932, lon: 73.80329 },
    ],
  },
  {
    slug: "sant-tukaram-nagar",
    name: "Sant Tukaram Nagar",
    lat: 18.61452,
    lon: 73.81575,
    exits: [
      { label: "Station exit", lat: 18.61452, lon: 73.81575 },
    ],
  },
  {
    slug: "nashik-phata",
    name: "Nashik Phata",
    lat: 18.6093,
    lon: 73.8201,
    exits: [
      { label: "Station exit", lat: 18.6093, lon: 73.8201 },
    ],
  },
  {
    slug: "kasarwadi",
    name: "Kasarwadi",
    lat: 18.59962,
    lon: 73.82726,
    exits: [
      { label: "Station exit", lat: 18.59962, lon: 73.82726 },
    ],
  },
  {
    slug: "phugewadi",
    name: "Phugewadi",
    lat: 18.59111,
    lon: 73.83115,
    exits: [
      { label: "Station exit", lat: 18.59111, lon: 73.83115 },
    ],
  },
  {
    slug: "dapodi",
    name: "Dapodi",
    lat: 18.58376,
    lon: 73.83377,
    exits: [
      { label: "Station exit", lat: 18.58376, lon: 73.83377 },
    ],
  },
  {
    slug: "bopodi",
    name: "Bopodi",
    lat: 18.56966,
    lon: 73.8381,
    exits: [
      { label: "Station exit", lat: 18.56966, lon: 73.8381 },
    ],
  },
  {
    slug: "khadki",
    name: "Khadki",
    lat: 18.56226,
    lon: 73.84208,
    exits: [
      { label: "Station exit", lat: 18.56226, lon: 73.84208 },
    ],
  },
  {
    slug: "range-hills",
    name: "Range Hills",
    lat: 18.55029,
    lon: 73.84581,
    exits: [
      { label: "Station exit", lat: 18.55029, lon: 73.84581 },
    ],
  },
  {
    slug: "shivaji-nagar",
    name: "Shivaji Nagar",
    lat: 18.53217,
    lon: 73.84966,
    exits: [
      { label: "Gate 1", lat: 18.53268, lon: 73.8494 },
    ],
  },
  {
    slug: "district-court",
    name: "District Court",
    lat: 18.52679,
    lon: 73.8569,
    exits: [
      { label: "Gate 1", lat: 18.5263, lon: 73.8575 },
      { label: "Gate 2", lat: 18.52708, lon: 73.85785 },
    ],
  },
  {
    slug: "kasba-peth",
    name: "Kasba Peth",
    lat: 18.52137,
    lon: 73.85962,
    exits: [
      { label: "Station exit", lat: 18.52137, lon: 73.85962 },
    ],
  },
  {
    slug: "mahatma-phule-mandai",
    name: "Mahatma Phule Mandai",
    lat: 18.5129,
    lon: 73.85701,
    exits: [
      { label: "Station exit", lat: 18.5129, lon: 73.85701 },
    ],
  },
  {
    slug: "swargate",
    name: "Swargate",
    lat: 18.49975,
    lon: 73.85746,
    exits: [
      { label: "Station exit", lat: 18.49975, lon: 73.85746 },
    ],
  },
  {
    slug: "vanaz",
    name: "Vanaz",
    lat: 18.50719,
    lon: 73.80519,
    exits: [
      { label: "Station exit", lat: 18.50719, lon: 73.80519 },
    ],
  },
  {
    slug: "anandnagar",
    name: "Anandnagar",
    lat: 18.50957,
    lon: 73.81407,
    exits: [
      { label: "Station exit", lat: 18.50957, lon: 73.81407 },
    ],
  },
  {
    slug: "paud-phata",
    name: "Paud Phata",
    lat: 18.50889,
    lon: 73.82214,
    exits: [
      { label: "Station exit", lat: 18.50889, lon: 73.82214 },
    ],
  },
  {
    slug: "sndt-college",
    name: "SNDT College",
    lat: 18.50736,
    lon: 73.82878,
    exits: [
      { label: "Station exit", lat: 18.50736, lon: 73.82878 },
    ],
  },
  {
    slug: "garware-college",
    name: "Garware College",
    lat: 18.51199,
    lon: 73.83805,
    exits: [
      { label: "Station exit", lat: 18.51199, lon: 73.83805 },
    ],
  },
  {
    slug: "deccan-gymkhana",
    name: "Deccan Gymkhana",
    lat: 18.51645,
    lon: 73.84445,
    exits: [
      { label: "Station exit", lat: 18.51645, lon: 73.84445 },
    ],
  },
  {
    slug: "chhatrapati-sambhaji-udyan",
    name: "Chhatrapati Sambhaji Udyan",
    lat: 18.52008,
    lon: 73.84738,
    exits: [
      { label: "Station exit", lat: 18.52008, lon: 73.84738 },
    ],
  },
  {
    slug: "pmc-bhavan",
    name: "PMC Bhavan",
    lat: 18.52274,
    lon: 73.85335,
    exits: [
      { label: "Station exit", lat: 18.52274, lon: 73.85335 },
    ],
  },
  {
    slug: "mangalwar-peth",
    name: "Mangalwar Peth",
    lat: 18.53007,
    lon: 73.8651,
    exits: [
      { label: "Station exit", lat: 18.53007, lon: 73.8651 },
    ],
  },
  {
    slug: "pune-railway-station",
    name: "Pune Railway Station",
    lat: 18.52976,
    lon: 73.87241,
    exits: [
      { label: "Station exit", lat: 18.52976, lon: 73.87241 },
    ],
  },
  {
    slug: "ruby-hall-clinic",
    name: "Ruby Hall Clinic",
    lat: 18.53272,
    lon: 73.87775,
    exits: [
      { label: "Station exit", lat: 18.53272, lon: 73.87775 },
    ],
  },
  {
    slug: "bund-garden",
    name: "Bund Garden",
    lat: 18.54059,
    lon: 73.88344,
    exits: [
      { label: "Station exit", lat: 18.54059, lon: 73.88344 },
    ],
  },
  {
    slug: "yerwada",
    name: "Yerwada",
    lat: 18.54532,
    lon: 73.88669,
    exits: [
      { label: "Gate 2", lat: 18.54559, lon: 73.887 },
      { label: "Gate 3", lat: 18.54526, lon: 73.88688 },
    ],
  },
  {
    slug: "kalyani-nagar",
    name: "Kalyani Nagar",
    lat: 18.54448,
    lon: 73.9057,
    exits: [
      { label: "Station exit", lat: 18.54448, lon: 73.9057 },
    ],
  },
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
];

export type LineId = "purple" | "aqua";

/** Line info kept apart from the Station type. Slugs in running order. */
export const lines: Record<LineId, { name: string; from: string; to: string; colour: string; slugs: string[] }> = {
  purple: {
    name: "Purple Line",
    from: "PCMC",
    to: "Swargate",
    colour: "#7b3fa0",
    slugs: ["pcmc","sant-tukaram-nagar","nashik-phata","kasarwadi","phugewadi","dapodi","bopodi","khadki","range-hills","shivaji-nagar","district-court","kasba-peth","mahatma-phule-mandai","swargate"],
  },
  aqua: {
    name: "Aqua Line",
    from: "Vanaz",
    to: "Ramwadi",
    colour: "#0e8a9c",
    slugs: ["vanaz","anandnagar","paud-phata","sndt-college","garware-college","deccan-gymkhana","chhatrapati-sambhaji-udyan","pmc-bhavan","district-court","mangalwar-peth","pune-railway-station","ruby-hall-clinic","bund-garden","yerwada","kalyani-nagar","ramwadi"],
  },
};

/** Other names OSM records for a station (old_name tags and entrance names at the same spot), used for search. */
export const stationAliases: Record<string, string[]> = {
  "paud-phata": ["Ideal Colony"],
  "sndt-college": ["Nal Stop", "Nalstop"],
};

export function getStation(slug: string): Station | null {
  return stations.find((station) => station.slug === slug) ?? null;
}

export function linesOf(slug: string): LineId[] {
  return (Object.keys(lines) as LineId[]).filter((id) => lines[id].slugs.includes(slug));
}

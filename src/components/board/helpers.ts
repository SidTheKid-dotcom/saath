import type { GroupMember, Point } from "@/lib/types";

export type DropPin = {
  id: string;
  lat: number;
  lon: number;
  number: number;
};

export type Bounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};

/** Okabe–Ito, without yellow, so lines stay visible on the light map. */
export const GROUP_COLOURS = [
  "#0072B2",
  "#D55E00",
  "#009E73",
  "#CC79A7",
  "#E69F00",
  "#56B4E9",
] as const;

const HUMAN_NAME = /^[\p{L}][\p{L}\p{M}'’. -]{0,31}$/u;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function colourForGroup(index: number): string {
  const size = GROUP_COLOURS.length;
  const wrapped = ((index % size) + size) % size;
  return GROUP_COLOURS[wrapped];
}

export function textOn(hex: string): "#111111" | "#ffffff" {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return "#ffffff";
  const value = Number.parseInt(match[1], 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance > 0.62 ? "#111111" : "#ffffff";
}

export function groupFareTotal(shares: readonly number[]): number {
  return shares.reduce((sum, share) => sum + share, 0);
}

export function boundsOf(points: readonly Point[]): Bounds | null {
  if (points.length === 0) return null;
  let west = points[0].lon;
  let east = points[0].lon;
  let south = points[0].lat;
  let north = points[0].lat;
  for (const point of points) {
    if (point.lon < west) west = point.lon;
    if (point.lon > east) east = point.lon;
    if (point.lat < south) south = point.lat;
    if (point.lat > north) north = point.lat;
  }
  return { west, south, east, north };
}

export function boundsAreFlat(bounds: Bounds): boolean {
  return bounds.west === bounds.east && bounds.south === bounds.north;
}

/**
 * Polyline for a group. Uses the stored route; without one, joins the station to each
 * drop pin in drop order. Fewer than two points means nothing to draw.
 */
export function routeLine(
  route: Point[] | undefined,
  station: Point,
  pins: readonly DropPin[],
): Point[] | null {
  if (route && route.length >= 2) return route;
  if (pins.length === 0) return null;
  return [{ lat: station.lat, lon: station.lon }, ...pins.map((pin) => ({ lat: pin.lat, lon: pin.lon }))];
}

/**
 * Numbered drop pins in riderIds order. A member without its own point falls back to
 * `known` (e.g. the waiting list); members with no point at all are skipped.
 */
export function dropPins(
  riderIds: readonly string[],
  members: readonly GroupMember[],
  known?: ReadonlyMap<string, Point>,
): DropPin[] {
  const byId = new Map(members.map((member) => [member.id, member]));
  const pins: DropPin[] = [];
  riderIds.forEach((id, index) => {
    const member = byId.get(id);
    if (!member) return;
    const lat = member.lat ?? known?.get(id)?.lat;
    const lon = member.lon ?? known?.get(id)?.lon;
    if (lat === undefined || lon === undefined) return;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    pins.push({ id, lat, lon, number: index + 1 });
  });
  return pins;
}

export function pointsForFit(
  station: Point,
  lines: readonly Point[][],
  pins: readonly DropPin[],
): Point[] {
  const points: Point[] = [{ lat: station.lat, lon: station.lon }];
  for (const line of lines) {
    for (const point of line) points.push(point);
  }
  for (const pin of pins) points.push({ lat: pin.lat, lon: pin.lon });
  return points;
}

export function riderTitle(id: string, fallback: string): string {
  const trimmed = id.trim();
  if (trimmed.length === 0 || trimmed.length > 32 || UUID.test(trimmed) || !HUMAN_NAME.test(trimmed)) {
    return fallback;
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function isBoardKeyRejected(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /\((?:401|403)\)/.test(error.message);
}

export function shouldLoadDemoGroups(demo: string | null, useMock: string | undefined): boolean {
  return demo === "groups" && useMock === "1";
}

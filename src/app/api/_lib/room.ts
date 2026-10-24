import { NextResponse } from "next/server";
import { getStation } from "../../../lib/stations";

export const BBOX = { minLon: 73.7, minLat: 18.4, maxLon: 74.05, maxLat: 18.7 };

export function inBbox(lat: number, lon: number): boolean {
  return lat >= BBOX.minLat && lat <= BBOX.maxLat && lon >= BBOX.minLon && lon <= BBOX.maxLon;
}

export const ROOM_WINDOW = "3 hours";

export function stationOr404(slug: string) {
  const station = getStation(slug);
  if (!station) return { station: null, error: NextResponse.json({ error: "Unknown station" }, { status: 404 }) };
  return { station, error: null };
}

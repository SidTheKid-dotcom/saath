import { NextResponse } from "next/server";
import { getStation } from "../../../lib/stations";
import type { GeocodeResponse } from "../../../lib/types";
import { inBbox } from "../_lib/room";

async function google(q: string, lat: number, lon: number, key: string): Promise<GeocodeResponse> {
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": key,
      "x-goog-fieldmask": "places.displayName,places.formattedAddress,places.location",
    },
    body: JSON.stringify({
      textQuery: q,
      regionCode: "IN",
      languageCode: "en",
      maxResultCount: 5,
      locationBias: { circle: { center: { latitude: lat, longitude: lon }, radius: 15000 } },
    }),
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) throw new Error(`google ${response.status}`);
  const json = (await response.json()) as {
    places?: Array<{
      displayName?: { text?: string };
      formattedAddress?: string;
      location?: { latitude: number; longitude: number };
    }>;
  };
  return (json.places ?? [])
    .filter((p) => p.location)
    .map((p) => ({
      label: [p.displayName?.text, p.formattedAddress].filter(Boolean).join(", "),
      lat: p.location!.latitude,
      lon: p.location!.longitude,
    }))
    .slice(0, 5);
}

async function photon(q: string, lat: number, lon: number): Promise<GeocodeResponse> {
  const params = new URLSearchParams({
    q,
    lat: String(lat),
    lon: String(lon),
    limit: "5",
    bbox: "73.70,18.40,74.05,18.70",
  });
  const response = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`photon ${response.status}`);
  const json = (await response.json()) as {
    features?: Array<{
      geometry?: { coordinates?: [number, number] };
      properties?: Record<string, string | undefined>;
    }>;
  };
  const out: GeocodeResponse = [];
  for (const f of json.features ?? []) {
    const c = f.geometry?.coordinates;
    if (!c) continue;
    const p = f.properties ?? {};
    const label = [p.name, p.street, p.suburb ?? p.district, p.city].filter(Boolean).join(", ");
    out.push({ label: label || "Unnamed place", lat: c[1], lon: c[0] });
  }
  return out.slice(0, 5);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const station = getStation(url.searchParams.get("station") ?? "");
  if (!q || q.length > 200) return NextResponse.json({ error: "Missing q" }, { status: 400 });
  if (!station) return NextResponse.json({ error: "Unknown station" }, { status: 404 });

  const key = process.env.GOOGLE_MAPS_SERVER_KEY;
  let results: GeocodeResponse | null = null;
  if (key) {
    try {
      results = (await google(q, station.lat, station.lon, key)).filter((r) => inBbox(r.lat, r.lon));
      if (results.length === 0) results = null;
    } catch {
      results = null;
    }
  }
  if (!results) {
    try {
      results = await photon(q, station.lat, station.lon);
    } catch {
      return NextResponse.json({ error: "Geocoder unavailable" }, { status: 502 });
    }
  }
  return NextResponse.json(results);
}

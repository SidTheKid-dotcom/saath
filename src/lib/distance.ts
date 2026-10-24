import type { Point } from "./types";

export type DistanceMatrix = {
  km: number[][];
  estimated: boolean;
};

export type DistanceOptions = {
  /** Injected for tests; defaults to the global fetch. */
  fetchImpl?: typeof fetch;
};

export type RouteKm = {
  /** km of each leg between consecutive points (points.length - 1 entries). */
  legKm: number[];
  estimated: boolean;
};

const OSRM = "https://router.project-osrm.org";
const TIMEOUT_MS = 4000;
/** Straight line to road distance, used whenever OSRM cannot answer. */
const ROAD_FACTOR = 1.35;
const EARTH_RADIUS_KM = 6371;

/**
 * Road km between every pair of points (index 0 = station). Falls back to
 * haversine × 1.35 for the whole matrix on any OSRM problem.
 */
export async function distanceMatrix(
  points: Point[],
  opts: DistanceOptions = {},
): Promise<DistanceMatrix> {
  assertPoints(points);
  if (points.length < 2) return { km: points.map(() => [0]), estimated: false };
  try {
    const body = await fetchJson(
      `${OSRM}/table/v1/driving/${coords(points)}?annotations=distance`,
      opts.fetchImpl,
    );
    const km = parseTable(body, points.length);
    if (km) return { km, estimated: false };
  } catch {
    // fall through to the estimate
  }
  return haversineMatrix(points);
}

/** Road km of each leg of a route through the points in order, one OSRM call. */
export async function routeKm(points: Point[], opts: DistanceOptions = {}): Promise<RouteKm> {
  assertPoints(points);
  if (points.length < 2) return { legKm: [], estimated: false };
  try {
    const body = await fetchJson(
      `${OSRM}/route/v1/driving/${coords(points)}?overview=false&steps=false`,
      opts.fetchImpl,
    );
    const legKm = parseLegs(body, points.length - 1);
    if (legKm) return { legKm, estimated: false };
  } catch {
    // fall through to the estimate
  }
  return {
    legKm: points.slice(1).map((p, i) => haversineKm(points[i], p) * ROAD_FACTOR),
    estimated: true,
  };
}

/** The fallback matrix: haversine × 1.35, no network. */
export function haversineMatrix(points: Point[]): DistanceMatrix {
  assertPoints(points);
  return {
    km: points.map((a, i) => points.map((b, j) => (i === j ? 0 : haversineKm(a, b) * ROAD_FACTOR))),
    estimated: true,
  };
}

export function haversineKm(a: Point, b: Point): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial bearing from a to b in degrees, 0 = north, clockwise, in [0, 360). */
export function bearingDeg(a: Point, b: Point): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLon = toRad(b.lon - a.lon);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return ((deg % 360) + 360) % 360;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function assertPoints(points: Point[]): void {
  for (const p of points) {
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon)) {
      throw new RangeError(`invalid point ${p.lat},${p.lon}`);
    }
  }
}

function coords(points: Point[]): string {
  return points.map((p) => `${p.lon},${p.lat}`).join(";");
}

/** GET + JSON with a hard 4 s limit, even if the fetch ignores the abort signal. */
async function fetchJson(url: string, fetchImpl: typeof fetch | undefined): Promise<unknown> {
  const doFetch = fetchImpl ?? globalThis.fetch;
  if (typeof doFetch !== "function") throw new Error("fetch unavailable");
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error("OSRM timeout"));
    }, TIMEOUT_MS);
  });
  const work = (async () => {
    const res = await doFetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    return (await res.json()) as unknown;
  })();
  try {
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** Metres to km; null unless the body is an n × n table of finite, non-negative numbers. */
function parseTable(body: unknown, n: number): number[][] | null {
  if (!isRecord(body) || body.code !== "Ok" || !Array.isArray(body.distances)) return null;
  if (body.distances.length !== n) return null;
  const km: number[][] = [];
  for (const row of body.distances) {
    if (!Array.isArray(row) || row.length !== n) return null;
    const out: number[] = [];
    for (const cell of row) {
      if (!isDistance(cell)) return null;
      out.push(cell / 1000);
    }
    km.push(out);
  }
  return km;
}

function parseLegs(body: unknown, legs: number): number[] | null {
  if (!isRecord(body) || body.code !== "Ok" || !Array.isArray(body.routes)) return null;
  const route: unknown = body.routes[0];
  if (!isRecord(route) || !Array.isArray(route.legs) || route.legs.length !== legs) return null;
  const km: number[] = [];
  for (const leg of route.legs) {
    if (!isRecord(leg) || !isDistance(leg.distance)) return null;
    km.push(leg.distance / 1000);
  }
  return km;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDistance(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

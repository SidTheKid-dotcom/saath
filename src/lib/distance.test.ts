import { afterEach, describe, expect, it, vi } from "vitest";
import { bearingDeg, distanceMatrix, haversineKm, routeKm } from "./distance";

const RAMWADI = { lat: 18.55703, lon: 73.90856 };
const VIMAN_NAGAR = { lat: 18.56772, lon: 73.91395 };
const VANAZ = { lat: 18.50719, lon: 73.80519 };
const POINTS = [RAMWADI, VIMAN_NAGAR, VANAZ];

const ok = (body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })) as unknown as typeof fetch;

function expectFallback(m: { km: number[][]; estimated: boolean }) {
  expect(m.estimated).toBe(true);
  expect(m.km[0][0]).toBe(0);
  expect(m.km[0][1]).toBeCloseTo(haversineKm(RAMWADI, VIMAN_NAGAR) * 1.35, 9);
  expect(m.km[2][0]).toBeCloseTo(haversineKm(VANAZ, RAMWADI) * 1.35, 9);
}

afterEach(() => {
  vi.useRealTimers();
});

describe("haversineKm and bearingDeg", () => {
  it("gives known distances", () => {
    // One degree of arc on a 6371 km sphere.
    expect(haversineKm({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(111.195, 3);
    expect(haversineKm({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(111.195, 3);
    expect(haversineKm(RAMWADI, RAMWADI)).toBe(0);
    expect(haversineKm(RAMWADI, VANAZ)).toBeCloseTo(haversineKm(VANAZ, RAMWADI), 12);
    expect(haversineKm(RAMWADI, VANAZ)).toBeGreaterThan(12.1);
    expect(haversineKm(RAMWADI, VANAZ)).toBeLessThan(12.4);
  });

  it("gives compass bearings in [0, 360)", () => {
    expect(bearingDeg({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(0, 9);
    expect(bearingDeg({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(90, 9);
    expect(bearingDeg({ lat: 0, lon: 0 }, { lat: -1, lon: 0 })).toBeCloseTo(180, 9);
    expect(bearingDeg({ lat: 0, lon: 0 }, { lat: 0, lon: -1 })).toBeCloseTo(270, 9);
    // Viman Nagar is north-east of Ramwadi, Vanaz south-west.
    const ne = bearingDeg(RAMWADI, VIMAN_NAGAR);
    const sw = bearingDeg(RAMWADI, VANAZ);
    expect(ne).toBeGreaterThan(0);
    expect(ne).toBeLessThan(90);
    expect(sw).toBeGreaterThan(180);
    expect(sw).toBeLessThan(270);
    expect(bearingDeg({ lat: 0, lon: 0 }, { lat: 1, lon: -0.0001 })).toBeLessThan(360);
  });
});

describe("distanceMatrix", () => {
  it("uses the OSRM table in km when it answers", async () => {
    const fetchImpl = ok({
      code: "Ok",
      distances: [
        [0, 1500, 14000],
        [1600, 0, 15000],
        [14100, 15100, 0],
      ],
    });
    const m = await distanceMatrix(POINTS, { fetchImpl });
    expect(m).toEqual({
      km: [
        [0, 1.5, 14],
        [1.6, 0, 15],
        [14.1, 15.1, 0],
      ],
      estimated: false,
    });
    expect(vi.mocked(fetchImpl).mock.calls[0][0]).toBe(
      "https://router.project-osrm.org/table/v1/driving/73.90856,18.55703;73.91395,18.56772;73.80519,18.50719?annotations=distance",
    );
  });

  it("falls back to haversine × 1.35 when fetch throws", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("network down");
    }) as unknown as typeof fetch;
    expectFallback(await distanceMatrix(POINTS, { fetchImpl }));
  });

  it("falls back when OSRM is not ok", async () => {
    const fetchImpl = vi.fn(async () => new Response("busy", { status: 429 })) as unknown as typeof fetch;
    expectFallback(await distanceMatrix(POINTS, { fetchImpl }));
  });

  it("falls back after the 4 s timeout", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(
      () => new Promise<Response>(() => {}), // never answers, ignores the signal
    ) as unknown as typeof fetch;
    const pending = distanceMatrix(POINTS, { fetchImpl });
    let settled = false;
    void pending.then(() => (settled = true));
    await vi.advanceTimersByTimeAsync(3999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expectFallback(await pending);
    const init = vi.mocked(fetchImpl).mock.calls[0][1] as RequestInit;
    expect(init.signal?.aborted).toBe(true);
  });

  it("falls back on malformed bodies and null cells", async () => {
    const bodies = [
      { code: "Ok", distances: [[0, 1500, null], [1600, 0, 15000], [14100, 15100, 0]] },
      { code: "Ok", distances: [[0, 1500]] },
      { code: "NoTable", distances: [] },
      { routes: [] },
      "nonsense",
    ];
    for (const body of bodies) expectFallback(await distanceMatrix(POINTS, { fetchImpl: ok(body) }));
    const badJson = vi.fn(async () => new Response("{not json", { status: 200 })) as unknown as typeof fetch;
    expectFallback(await distanceMatrix(POINTS, { fetchImpl: badJson }));
  });
});

describe("routeKm", () => {
  it("reads leg metres from routes[0].legs", async () => {
    const fetchImpl = ok({ code: "Ok", routes: [{ legs: [{ distance: 1800 }, { distance: 700 }] }] });
    const r = await routeKm(POINTS, { fetchImpl });
    expect(r).toEqual({ legKm: [1.8, 0.7], estimated: false });
    expect(vi.mocked(fetchImpl).mock.calls[0][0]).toBe(
      "https://router.project-osrm.org/route/v1/driving/73.90856,18.55703;73.91395,18.56772;73.80519,18.50719?overview=false&steps=false",
    );
  });

  it("falls back per leg when the route is unusable", async () => {
    const fetchImpl = ok({ code: "Ok", routes: [{ legs: [{ distance: 1800 }] }] }); // one leg short
    const r = await routeKm(POINTS, { fetchImpl });
    expect(r.estimated).toBe(true);
    expect(r.legKm[0]).toBeCloseTo(haversineKm(RAMWADI, VIMAN_NAGAR) * 1.35, 9);
    expect(r.legKm[1]).toBeCloseTo(haversineKm(VIMAN_NAGAR, VANAZ) * 1.35, 9);
  });
});

import { describe, expect, it, vi } from "vitest";
import { distanceMatrix, haversineKm, haversineMatrix, type DistanceMatrix } from "./distance";
import { splitFare, tariff } from "./fare";
import { formGroups, formGroupsRouted } from "./grouping";
import type { Group, Point, RiderInput } from "./types";

const RAMWADI = { lat: 18.55703, lon: 73.90856 };
const NOON_IST = new Date("2026-10-24T06:30:00Z");
const ONE_AM_IST = new Date("2026-10-23T19:30:00Z");

/** Three drops along the road toward Viman Nagar, nearest first. */
const VIMAN_NAGAR_RIDERS: RiderInput[] = [
  { id: "c-datta", lat: 18.56772, lon: 73.91395 },
  { id: "a-near", lat: 18.561, lon: 73.9108 },
  { id: "b-mid", lat: 18.565, lon: 73.9128 },
];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomRiders(seed: number, count: number, spreadDeg: number): RiderInput[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => ({
    id: `r${String(i).padStart(3, "0")}`,
    lat: RAMWADI.lat + (rand() * 2 - 1) * spreadDeg,
    lon: RAMWADI.lon + (rand() * 2 - 1) * spreadDeg,
  }));
}

function coordsOf(url: string): Point[] {
  const list = new URL(url).pathname.split("/").pop() ?? "";
  return list.split(";").map((pair) => {
    const [lon, lat] = pair.split(",").map(Number);
    return { lat, lon };
  });
}

/** Fake OSRM: road metres = haversine × 1.3 (× optional per-pair noise). */
function fakeOsrm(noise: (a: Point, b: Point) => number = () => 1) {
  return vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    const pts = coordsOf(url);
    const metres = (a: Point, b: Point) => haversineKm(a, b) * 1300 * noise(a, b);
    const body = url.includes("/table/")
      ? { code: "Ok", distances: pts.map((a) => pts.map((b) => (a === b ? 0 : metres(a, b)))) }
      : { code: "Ok", routes: [{ legs: pts.slice(1).map((b, i) => ({ distance: metres(pts[i], b) })) }] };
    return new Response(JSON.stringify(body), { status: 200 });
  });
}

/** Contract invariants plus the per-member rules, for any output of the grouping. */
function expectInvariants(riders: RiderInput[], groups: Group[], at: Date) {
  const ids = groups.flatMap((g) => g.riderIds);
  expect([...ids].sort()).toEqual(riders.map((r) => r.id).sort());
  expect(new Set(ids).size).toBe(riders.length);
  const byId = new Map(riders.map((r) => [r.id, r]));
  for (const g of groups) {
    expect(g.riderIds.length).toBeGreaterThanOrEqual(1);
    expect(g.riderIds.length).toBeLessThanOrEqual(3);
    expect(g.perRider.map((m) => m.id)).toEqual(g.riderIds);
    expect(g.legKm).toHaveLength(g.riderIds.length);
    expect(g.totalKm).toBeCloseTo(g.legKm.reduce((a, b) => a + b, 0), 9);
    const total = tariff(g.totalKm, at);
    expect(g.perRider.reduce((a, m) => a + m.share, 0)).toBe(total);
    expect(g.perRider.map((m) => m.share)).toEqual(splitFare(total, g.perRider.map((m) => m.soloFare)));
    let ride = 0;
    g.perRider.forEach((m, k) => {
      ride += g.legKm[k];
      const rider = byId.get(m.id);
      expect(m.lat).toBe(rider?.lat);
      expect(m.lon).toBe(rider?.lon);
      expect(m.rideKm).toBeCloseTo(ride, 9);
      expect(m.soloFare).toBe(tariff(m.soloKm, at));
      expect(Number.isInteger(m.share)).toBe(true);
      expect(m.share).toBeLessThanOrEqual(m.soloFare);
      expect(m.rideKm).toBeLessThanOrEqual(Math.min(m.soloKm * 1.25, m.soloKm + 1.5) + 1e-9);
    });
    if (g.riderIds.length === 1) expect(g.perRider[0].share).toBe(g.perRider[0].soloFare);
  }
}

describe("formGroups", () => {
  it("(a) puts 3 riders toward Viman Nagar from Ramwadi in one auto, nearest drop first", async () => {
    const riders = VIMAN_NAGAR_RIDERS;
    const matrix = await distanceMatrix([RAMWADI, ...riders], { fetchImpl: fakeOsrm() as unknown as typeof fetch });
    expect(matrix.estimated).toBe(false);
    const groups = formGroups(RAMWADI, riders, matrix, NOON_IST);
    expect(groups).toHaveLength(1);
    expect(groups[0].riderIds).toEqual(["a-near", "b-mid", "c-datta"]);
    expect(groups[0].estimated).toBe(false);
    expect(groups[0].perRider.map((m) => m.soloKm)).toEqual([
      matrix.km[0][2],
      matrix.km[0][3],
      matrix.km[0][1],
    ]);
    expectInvariants(riders, groups, NOON_IST);
  });

  it("(b) keeps 2 opposite-direction riders solo", () => {
    const riders: RiderInput[] = [
      { id: "north-east", lat: 18.56772, lon: 73.91395 },
      { id: "south-west", lat: 18.5475, lon: 73.8995 },
    ];
    const matrix = haversineMatrix([RAMWADI, ...riders]);
    const groups = formGroups(RAMWADI, riders, matrix, NOON_IST);
    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.riderIds).sort()).toEqual([["north-east"], ["south-west"]]);
    for (const g of groups) {
      expect(g.perRider[0].share).toBe(g.perRider[0].soloFare);
      expect(g.estimated).toBe(true);
    }
    expectInvariants(riders, groups, NOON_IST);
  });

  it("(c) satisfies every invariant for 7 seeded random riders around Ramwadi", () => {
    let shared = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const riders = randomRiders(seed, 7, 0.03);
      const rand = mulberry32(seed * 7919);
      // Asymmetric, noisy "road" matrix so the rules cannot lean on symmetry.
      const base = haversineMatrix([RAMWADI, ...riders]).km;
      const matrix: DistanceMatrix = {
        km: base.map((row) => row.map((v) => v * (1 + rand() * 0.3))),
        estimated: false,
      };
      const at = seed % 2 ? NOON_IST : ONE_AM_IST;
      const groups = formGroups(RAMWADI, riders, matrix, at);
      expectInvariants(riders, groups, at);
      for (const g of groups) {
        g.perRider.forEach((m, k) => {
          const i = riders.findIndex((r) => r.id === m.id) + 1;
          expect(m.soloKm).toBe(matrix.km[0][i]);
          const prev = k === 0 ? 0 : riders.findIndex((r) => r.id === g.riderIds[k - 1]) + 1;
          expect(g.legKm[k]).toBe(matrix.km[prev][i]);
        });
        if (g.riderIds.length > 1) shared++;
      }
    }
    expect(shared).toBeGreaterThan(0);
  });

  it("(f) copies every rider's lat/lon (and destText if given) onto perRider", () => {
    const riders = [
      ...randomRiders(42, 7, 0.03),
      { id: "named", lat: 18.565, lon: 73.9128, destText: "Weikfield IT Park" } as RiderInput,
    ];
    const groups = formGroups(RAMWADI, riders, haversineMatrix([RAMWADI, ...riders]), NOON_IST);
    const members = groups.flatMap((g) => g.perRider);
    expect(members).toHaveLength(riders.length);
    for (const r of riders) {
      const m = members.find((x) => x.id === r.id);
      expect(m?.lat).toBe(r.lat);
      expect(m?.lon).toBe(r.lon);
    }
    expect(members.find((m) => m.id === "named")?.destText).toBe("Weikfield IT Park");
  });

  it("seeds with the farthest rider, breaks ties by smaller id, and is deterministic", () => {
    // Same point twice: equal soloKm, so the smaller id must seed and drop first.
    const riders: RiderInput[] = [
      { id: "zed", lat: 18.565, lon: 73.9128 },
      { id: "amy", lat: 18.565, lon: 73.9128 },
    ];
    const matrix = haversineMatrix([RAMWADI, ...riders]);
    const groups = formGroups(RAMWADI, riders, matrix, NOON_IST);
    expect(groups.map((g) => g.riderIds)).toEqual([["amy", "zed"]]);
    expect(formGroups(RAMWADI, riders, matrix, NOON_IST)).toEqual(groups);
    expect(formGroups(RAMWADI, [], { km: [[0]], estimated: false }, NOON_IST)).toEqual([]);
  });

  it("refuses a candidate whose detour breaks rule 5", () => {
    // Same direction, but the far rider would ride 2 km of detour for a 2 km trip.
    const riders: RiderInput[] = [
      { id: "far", lat: 18.5735, lon: 73.917 },
      { id: "side", lat: 18.566, lon: 73.926 },
    ];
    const groups = formGroups(RAMWADI, riders, haversineMatrix([RAMWADI, ...riders]), NOON_IST);
    expect(groups.map((g) => g.riderIds)).toEqual([["side"], ["far"]]);
    expectInvariants(riders, groups, NOON_IST);
  });

  it("only pairs riders within 45° of the seed's bearing, even when the detour would be fine", () => {
    // Seed 3 km due north; a short hop 0.3 km away at 40° shares, at 60° does not.
    const far = { id: "far", lat: RAMWADI.lat + 0.02698, lon: RAMWADI.lon };
    const at40 = { id: "at40", lat: RAMWADI.lat + 0.002068, lon: RAMWADI.lon + 0.001831 };
    const at60 = { id: "at60", lat: RAMWADI.lat + 0.001349, lon: RAMWADI.lon + 0.002467 };
    const run = (riders: RiderInput[]) =>
      formGroups(RAMWADI, riders, haversineMatrix([RAMWADI, ...riders]), NOON_IST).map((g) => g.riderIds);
    expect(run([far, at40])).toEqual([["at40", "far"]]);
    expect(run([far, at60])).toEqual([["far"], ["at60"]]);
  });

  it("adds the candidate that adds the least route km while the auto has room", () => {
    // Seed 3 km due north. Two riders on the way add ~0 km; a third, 1 km out at 30°,
    // would also be acceptable but adds more, so it waits for the next auto.
    const km = 0.008993; // degrees of latitude per km
    const riders: RiderInput[] = [
      { id: "off", lat: RAMWADI.lat + 0.866 * km, lon: RAMWADI.lon + 0.5 / 105.4 },
      { id: "far", lat: RAMWADI.lat + 3 * km, lon: RAMWADI.lon },
      { id: "n15", lat: RAMWADI.lat + 1.5 * km, lon: RAMWADI.lon },
      { id: "n20", lat: RAMWADI.lat + 2 * km, lon: RAMWADI.lon },
    ];
    const groups = formGroups(RAMWADI, riders, haversineMatrix([RAMWADI, ...riders]), NOON_IST);
    expect(groups.map((g) => g.riderIds)).toEqual([["n15", "n20", "far"], ["off"]]);
    // Sanity: "off" alone with the seed would have been accepted.
    const pair = [riders[0], riders[1]];
    expect(formGroups(RAMWADI, pair, haversineMatrix([RAMWADI, ...pair]), NOON_IST)).toHaveLength(1);
  });

  it("rejects a matrix that does not match the riders", () => {
    expect(() => formGroups(RAMWADI, VIMAN_NAGAR_RIDERS, { km: [[0]], estimated: false })).toThrow();
  });
});

describe("formGroupsRouted", () => {
  it("(d) groups 250 seeded riders in under 2 s with mocked OSRM and keeps every invariant", async () => {
    const riders = randomRiders(250, 250, 0.05);
    let calls = 0;
    let inFlight = 0;
    let maxInFlight = 0;
    const osrm = fakeOsrm((a, b) => 1 + ((Math.abs(a.lat * 1e5 + b.lon * 1e5) % 7) / 100));
    const fetchImpl = vi.fn(async (input: string | URL | Request) => {
      calls++;
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1));
        if (calls % 9 === 0) return new Response("busy", { status: 503 });
        if (calls % 13 === 0) throw new TypeError("network down");
        return await osrm(input);
      } finally {
        inFlight--;
      }
    }) as unknown as typeof fetch;

    const started = performance.now();
    const groups = await formGroupsRouted(RAMWADI, riders, { fetchImpl, at: NOON_IST });
    const elapsed = performance.now() - started;

    expect(elapsed).toBeLessThan(2000);
    expectInvariants(riders, groups, NOON_IST);
    expect(groups.some((g) => g.riderIds.length === 3)).toBe(true);
    expect(groups.some((g) => g.estimated)).toBe(true);
    expect(groups.some((g) => !g.estimated)).toBe(true);
    expect(maxInFlight).toBeLessThanOrEqual(4);
    expect(calls).toBeLessThanOrEqual(riders.length);
    for (const [url] of vi.mocked(fetchImpl).mock.calls) {
      expect(String(url)).toMatch(/^https:\/\/router\.project-osrm\.org\/route\/v1\/driving\/.+\?overview=false&steps=false$/);
    }
  });

  it("keeps the real-km route when it passes, one route call per group", async () => {
    const fetchImpl = fakeOsrm() as unknown as typeof fetch;
    const groups = await formGroupsRouted(RAMWADI, VIMAN_NAGAR_RIDERS, { fetchImpl, at: NOON_IST });
    expect(groups.map((g) => g.riderIds)).toEqual([["a-near", "b-mid", "c-datta"]]);
    expect(groups[0].estimated).toBe(false);
    expect(vi.mocked(fetchImpl)).toHaveBeenCalledTimes(1);
    expect(groups[0].perRider[0].soloKm).toBe(groups[0].legKm[0]);
    expectInvariants(VIMAN_NAGAR_RIDERS, groups, NOON_IST);
  });

  it("rechecks on a like-for-like basis when real roads are much longer than the estimate", async () => {
    // Every road is 2× the screening estimate: solo km scale too, so the group still holds.
    const fetchImpl = fakeOsrm(() => 2 * (1.35 / 1.3)) as unknown as typeof fetch;
    const groups = await formGroupsRouted(RAMWADI, VIMAN_NAGAR_RIDERS, { fetchImpl, at: NOON_IST });
    expect(groups.map((g) => g.riderIds)).toEqual([["a-near", "b-mid", "c-datta"]]);
    const screened = formGroups(RAMWADI, VIMAN_NAGAR_RIDERS, haversineMatrix([RAMWADI, ...VIMAN_NAGAR_RIDERS]), NOON_IST);
    groups[0].perRider.forEach((m, k) => expect(m.soloKm).toBeCloseTo(2 * screened[0].perRider[k].soloKm, 9));
    expectInvariants(VIMAN_NAGAR_RIDERS, groups, NOON_IST);
  });

  it("splits a group whose real legs break the rules, keeping a passing prefix", async () => {
    const legsFor = (pts: Point[], longLeg: number) =>
      pts.slice(1).map((b, i) => ({ distance: i === longLeg ? 5000 : haversineKm(pts[i], b) * 1350 }));
    const run = async (longLeg: number) => {
      const fetchImpl = vi.fn(async (input: string | URL | Request) => {
        const pts = coordsOf(String(input));
        const legs = pts.length > 2 ? legsFor(pts, longLeg) : legsFor(pts, -1);
        return new Response(JSON.stringify({ code: "Ok", routes: [{ legs }] }), { status: 200 });
      }) as unknown as typeof fetch;
      const groups = await formGroupsRouted(RAMWADI, VIMAN_NAGAR_RIDERS, { fetchImpl, at: NOON_IST });
      expectInvariants(VIMAN_NAGAR_RIDERS, groups, NOON_IST);
      expect(groups.every((g) => !g.estimated)).toBe(true);
      return groups.map((g) => g.riderIds);
    };
    // Third leg is a 5 km loop: the first two still share, the last rides alone.
    expect(await run(2)).toEqual([["a-near", "b-mid"], ["c-datta"]]);
    // Second leg is the loop: no prefix of 2+ survives, everyone rides alone.
    expect(await run(1)).toEqual([["a-near"], ["b-mid"], ["c-datta"]]);
  });

  it("marks groups estimated when OSRM is down", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("network down");
    }) as unknown as typeof fetch;
    const riders = [...VIMAN_NAGAR_RIDERS, { id: "south-west", lat: 18.5475, lon: 73.8995 }];
    const groups = await formGroupsRouted(RAMWADI, riders, { fetchImpl, at: ONE_AM_IST });
    expect(groups.every((g) => g.estimated)).toBe(true);
    expect(groups.map((g) => g.riderIds.length).sort()).toEqual([1, 3]);
    expectInvariants(riders, groups, ONE_AM_IST);
    expect(await formGroupsRouted(RAMWADI, [], { fetchImpl })).toEqual([]);
  });
});

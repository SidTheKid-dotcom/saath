import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: Array<{ text: string; values: unknown[] }> = [];
let queue: Array<unknown[] | Error> = [];
const sql = Object.assign(
  (strings: TemplateStringsArray, ...values: unknown[]) => {
    calls.push({ text: strings.join("?"), values });
    const next = queue.shift() ?? [];
    return next instanceof Error ? Promise.reject(next) : Promise.resolve(next);
  },
  { transaction: vi.fn(async (qs: unknown[]) => qs) },
);

vi.mock("../../lib/db", () => ({
  getDb: () => sql,
  isUndefinedColumn: (e: unknown) => (e as { code?: string }).code === "42703",
}));
vi.mock("../../lib/distance", () => ({
  bearingDeg: vi.fn((a: { lon: number }, b: { lon: number }) => (b.lon > a.lon ? 90 : 270)),
}));
vi.mock("../../lib/grouping", () => ({
  formGroupsRouted: vi.fn(async (_s: unknown, riders: Array<{ id: string }>) => [
    { riderIds: riders.map((r) => r.id), totalKm: 3, legKm: [3], perRider: riders.map((r) => ({ id: r.id, soloKm: 1, rideKm: 1, soloFare: 30, share: 30 })), estimated: false },
  ]),
}));

import { POST as joinPost } from "./rooms/[station]/riders/route";
import { GET as stateGet } from "./rooms/[station]/state/route";
import { POST as formPost } from "./rooms/[station]/form/route";
import { GET as groupsGet } from "./rooms/[station]/groups/route";
import { POST as resetPost } from "./rooms/[station]/reset/route";
import { GET as geocodeGet } from "./geocode/route";

const ctx = (station: string) => ({ params: Promise.resolve({ station }) });
const json = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://x/api", { method: "POST", body: JSON.stringify(body), headers });

beforeEach(() => {
  calls.length = 0;
  queue = [];
  sql.transaction.mockClear();
  process.env.BOARD_KEY = "secret";
  delete process.env.GOOGLE_MAPS_SERVER_KEY;
});

describe("riders", () => {
  it("inserts a rider", async () => {
    const res = await joinPost(json({ destText: "Viman Nagar", lat: 18.567, lon: 73.914 }), ctx("ramwadi"));
    expect(res.status).toBe(200);
    expect((await res.json()).riderId).toMatch(/^[0-9a-f-]{36}$/);
    expect(calls).toHaveLength(1);
  });
  it("normalises an optional phone", async () => {
    const res = await joinPost(json({ destText: "V", lat: 18.567, lon: 73.914, phone: "98765 43210" }), ctx("ramwadi"));
    expect(res.status).toBe(200);
    expect(calls[0].values).toContain("+919876543210");
  });
  it("rejects an invalid phone", async () => {
    const res = await joinPost(json({ destText: "V", lat: 18.567, lon: 73.914, phone: "12345" }), ctx("ramwadi"));
    expect(res.status).toBe(400);
    expect(calls).toHaveLength(0);
  });
  it("still joins when the phone column is missing", async () => {
    queue = [Object.assign(new Error("column \"phone\" does not exist"), { code: "42703" }), []];
    const res = await joinPost(json({ destText: "V", lat: 18.567, lon: 73.914, phone: "9876543210" }), ctx("ramwadi"));
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(2);
    expect(calls[1].text).not.toContain("phone");
  });
  it("rejects points outside bbox", async () => {
    const res = await joinPost(json({ destText: "Mumbai", lat: 19.07, lon: 72.87 }), ctx("ramwadi"));
    expect(res.status).toBe(400);
    expect(calls).toHaveLength(0);
  });
  it("rejects bad body", async () => {
    const res = await joinPost(json({ lat: "x" }), ctx("ramwadi"));
    expect(res.status).toBe(400);
  });
  it("404s unknown station", async () => {
    const res = await joinPost(json({ destText: "a", lat: 18.5, lon: 73.9 }), ctx("nowhere"));
    expect(res.status).toBe(404);
  });
});

describe("state", () => {
  it("returns waiting, sameWay and group", async () => {
    const me = "11111111-1111-1111-1111-111111111111";
    const mk = (id: string, lon: number) => ({ id, name: null, dest_text: "d", lat: 18.56, lon });
    queue = [
      [mk(me, 73.95), mk("22222222-2222-2222-2222-222222222222", 73.96), mk("33333333-3333-3333-3333-333333333333", 73.85)],
      [{ ...mk(me, 73.95), group_id: "g1" }],
      [{ data: { riderIds: [me], estimated: true, meetAt: "Gate 2" } }],
    ];
    const res = await stateGet(new Request(`http://x/api?rider=${me}`), ctx("ramwadi"));
    const body = await res.json();
    expect(body.waiting).toHaveLength(3);
    expect(body.sameWay.map((r: { id: string }) => r.id)).toEqual(["22222222-2222-2222-2222-222222222222"]);
    expect(body.group.meetAt).toBe("Gate 2");
    expect(body.estimated).toBe(true);
  });
  it("without rider returns the board view", async () => {
    queue = [[{ id: "a", name: null, dest_text: "d", lat: 18.56, lon: 73.9 }]];
    const body = await (await stateGet(new Request("http://x/api"), ctx("ramwadi"))).json();
    expect(body.waiting).toHaveLength(1);
    expect(body.sameWay).toEqual([]);
    expect(body.group).toBeNull();
    expect(body.estimated).toBe(false);
  });
  it("404s unknown station", async () => {
    const res = await stateGet(new Request("http://x/api?rider=a"), ctx("nowhere"));
    expect(res.status).toBe(404);
  });
});

describe("form", () => {
  it("requires the board key", async () => {
    const res = await formPost(json({}), ctx("ramwadi"));
    expect(res.status).toBe(403);
    const bad = await formPost(json({}, { "x-board-key": "nope" }), ctx("ramwadi"));
    expect(bad.status).toBe(403);
    expect(calls).toHaveLength(0);
  });
  it("groups waiting riders and stores in one transaction", async () => {
    queue = [[
      { id: "a", lat: 18.56, lon: 73.91, dest_text: "d" },
      { id: "b", lat: 18.57, lon: 73.92, dest_text: "e" },
    ]];
    const res = await formPost(json({}, { "x-board-key": "secret" }), ctx("ramwadi"));
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].meetAt).toBe("Gate 2");
    expect(body[0].route).toHaveLength(3);
    expect(body[0].perRider[0]).toMatchObject({ lat: 18.56, lon: 73.91, destText: "d" });
    expect(sql.transaction).toHaveBeenCalledTimes(1);
    expect(sql.transaction.mock.calls[0][0]).toHaveLength(2);
  });
  it("returns [] with no waiting riders", async () => {
    queue = [[]];
    const res = await formPost(json({}, { "x-board-key": "secret" }), ctx("vanaz"));
    expect(await res.json()).toEqual([]);
    expect(sql.transaction).not.toHaveBeenCalled();
  });
});

describe("groups and reset", () => {
  it("lists groups", async () => {
    queue = [[{ id: "g", station: "ramwadi", created_at: "2026-10-24T07:00:00Z", data: { meetAt: "Gate 2" } }]];
    const res = await groupsGet(new Request("http://x/api"), ctx("ramwadi"));
    const body = await res.json();
    expect(body[0].createdAt).toBe("2026-10-24T07:00:00.000Z");
  });
  it("reset needs key", async () => {
    expect((await resetPost(json({}), ctx("ramwadi"))).status).toBe(403);
    const ok = await resetPost(json({}, { "x-board-key": "secret" }), ctx("ramwadi"));
    expect(await ok.json()).toEqual({ ok: true });
    expect(sql.transaction).toHaveBeenCalledTimes(1);
  });
});

describe("geocode", () => {
  it("uses Google when key set and keeps response shape", async () => {
    process.env.GOOGLE_MAPS_SERVER_KEY = "k";
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ places: [{ displayName: { text: "Phoenix" }, formattedAddress: "Viman Nagar", location: { latitude: 18.56, longitude: 73.91 } }] })),
    );
    vi.stubGlobal("fetch", fetchMock);
    const res = await geocodeGet(new Request("http://x/api/geocode?q=phoenix&station=ramwadi"));
    expect(await res.json()).toEqual([{ label: "Phoenix, Viman Nagar", lat: 18.56, lon: 73.91 }]);
    expect(String(fetchMock.mock.calls[0])).toContain("places.googleapis.com");
    vi.unstubAllGlobals();
  });
  it("falls back to Photon on Google error", async () => {
    process.env.GOOGLE_MAPS_SERVER_KEY = "k";
    const fetchMock = vi.fn(async (url: string | URL | Request) =>
      String(url).includes("google")
        ? new Response("no", { status: 500 })
        : new Response(JSON.stringify({ features: [{ geometry: { coordinates: [73.91, 18.56] }, properties: { name: "Phoenix", city: "Pune" } }] })),
    );
    vi.stubGlobal("fetch", fetchMock);
    const res = await geocodeGet(new Request("http://x/api/geocode?q=phoenix&station=ramwadi"));
    expect(await res.json()).toEqual([{ label: "Phoenix, Pune", lat: 18.56, lon: 73.91 }]);
    vi.unstubAllGlobals();
  });
  it("400 without q", async () => {
    expect((await geocodeGet(new Request("http://x/api/geocode?station=ramwadi"))).status).toBe(400);
  });
});

import { POST as acceptPost } from "./rooms/[station]/groups/[id]/accept/route";

describe("accept", () => {
  const gid = "0b6f1c1e-1d2a-4c3b-9e8f-123456789abc";
  const actx = (id: string) => ({ params: Promise.resolve({ station: "ramwadi", id }) });
  const row = { id: gid, station: "ramwadi", created_at: "2026-10-24T07:00:00Z", data: { riderIds: [], meetAt: "Gate 2", acceptedAt: "x" } };
  it("first accept wins, second gets 409", async () => {
    queue = [[row], [], [{ id: gid }]];
    const first = await acceptPost(new Request("http://x", { method: "POST" }), actx(gid));
    expect(first.status).toBe(200);
    expect((await first.json()).data.acceptedAt).toBe("x");
    const second = await acceptPost(new Request("http://x", { method: "POST" }), actx(gid));
    expect(second.status).toBe(409);
    expect(calls[0].text).toContain("NOT (data ? 'acceptedAt')");
  });
  it("404 for unknown or invalid ids", async () => {
    queue = [[], []];
    expect((await acceptPost(new Request("http://x", { method: "POST" }), actx(gid))).status).toBe(404);
    expect((await acceptPost(new Request("http://x", { method: "POST" }), actx("nope"))).status).toBe(404);
  });
});

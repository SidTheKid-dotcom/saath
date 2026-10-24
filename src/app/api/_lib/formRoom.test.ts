import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: Array<{ text: string; values: unknown[] }> = [];
let queue: unknown[][] = [];
/** When set, the second SQL call waits on this instead of the queue. */
let holdSecond: Promise<unknown[]> | null = null;
const sql = Object.assign(
  (strings: TemplateStringsArray, ...values: unknown[]) => {
    calls.push({ text: strings.join("?"), values });
    if (holdSecond && calls.length === 2) {
      const pending = holdSecond;
      holdSecond = null;
      return pending;
    }
    return Promise.resolve(queue.shift() ?? []);
  },
  { transaction: vi.fn(async (qs: unknown[]) => qs) },
);

vi.mock("../../../lib/db", () => ({
  getDb: () => sql,
}));
vi.mock("../../../lib/grouping", () => ({
  formGroupsRouted: vi.fn(async (_station: unknown, riders: Array<{ id: string }>) => [
    {
      riderIds: riders.map((rider) => rider.id),
      totalKm: 3,
      legKm: [3],
      perRider: riders.map((rider) => ({ id: rider.id, soloKm: 1, rideKm: 1, soloFare: 30, share: 15 })),
      estimated: false,
    },
  ]),
}));

import { getStation } from "../../../lib/stations";
import { resetFormRoomForTests, tryFormRoom } from "./formRoom";

const ramwadi = getStation("ramwadi")!;
const rider = (id: string, ageMs: number) => ({
  id,
  lat: 18.56,
  lon: 73.91,
  dest_text: id,
  age_ms: ageMs,
});

beforeEach(() => {
  calls.length = 0;
  queue = [];
  holdSecond = null;
  sql.transaction.mockClear();
  resetFormRoomForTests();
});

describe("tryFormRoom", () => {
  it("leaves a fresh single rider waiting", async () => {
    queue = [[], [rider("a", 1_000)]];
    const result = await tryFormRoom(ramwadi);
    expect(result).toEqual({ formed: false, groups: [] });
    expect(sql.transaction).not.toHaveBeenCalled();
    expect(calls.some((call) => call.text.includes("form_locks"))).toBe(true);
    expect(calls.some((call) => call.text.includes("INSERT INTO form_locks"))).toBe(false);
  });

  it("does not form two riders until the newest has settled", async () => {
    queue = [[], [rider("a", 30_000), rider("b", 1_000)]];
    expect(await tryFormRoom(ramwadi)).toEqual({ formed: false, groups: [] });
    expect(sql.transaction).not.toHaveBeenCalled();
  });

  it("stores a settled pair once, with the gate and drop route", async () => {
    const pair = [rider("a", 30_000), rider("b", 10_000)];
    queue = [[], pair, [{ station: "ramwadi" }], pair, [], [], []];
    const result = await tryFormRoom(ramwadi);
    expect(result.formed).toBe(true);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].meetAt).toBe("Gate 2");
    expect(result.groups[0].route?.[0]).toEqual({ lat: ramwadi.exits[0].lat, lon: ramwadi.exits[0].lon });
    expect(result.groups[0].perRider[0]).toMatchObject({ destText: "a", lat: 18.56, lon: 73.91 });
    expect(sql.transaction).toHaveBeenCalledTimes(1);
    expect(sql.transaction.mock.calls[0][0]).toHaveLength(2);
    expect(calls.at(-1)?.text).toContain("UPDATE form_locks");
  });

  it("forms a rider who has waited alone for a minute", async () => {
    const alone = [rider("solo", 60_000)];
    queue = [[], alone, [{ station: "ramwadi" }], alone, [], [], []];
    const result = await tryFormRoom(ramwadi);
    expect(result.formed).toBe(true);
    expect(result.groups[0].riderIds).toEqual(["solo"]);
  });

  it("skips when another form holds the lock, and does not clear that lock", async () => {
    queue = [[], [rider("a", 20_000), rider("b", 20_000)], []];
    expect(await tryFormRoom(ramwadi)).toEqual({ formed: false, groups: [] });
    expect(sql.transaction).not.toHaveBeenCalled();
    expect(calls.some((call) => call.text.includes("UPDATE form_locks"))).toBe(false);
  });

  it("releases the lock when the room is no longer ready", async () => {
    queue = [
      [],
      [rider("a", 20_000), rider("b", 20_000)],
      [{ station: "ramwadi" }],
      [rider("a", 1_000)],
      [],
    ];
    expect(await tryFormRoom(ramwadi)).toEqual({ formed: false, groups: [] });
    expect(sql.transaction).not.toHaveBeenCalled();
    expect(calls.at(-1)?.text).toContain("UPDATE form_locks");
  });

  it("shares one in-flight attempt across overlapping polls", async () => {
    let release: (rows: unknown[]) => void = () => {};
    holdSecond = new Promise((resolve) => {
      release = resolve;
    });
    const pair = [rider("a", 20_000), rider("b", 20_000)];
    queue = [[], [{ station: "ramwadi" }], pair, [], [], []];
    const first = tryFormRoom(ramwadi);
    const second = tryFormRoom(ramwadi);
    await vi.waitFor(() => expect(calls.length).toBeGreaterThanOrEqual(2));
    release(pair);
    const [left, right] = await Promise.all([first, second]);
    expect(left).toBe(right);
    expect(left.formed).toBe(true);
    expect(sql.transaction).toHaveBeenCalledTimes(1);
  });
});

import { expect, test, type APIRequestContext } from "@playwright/test";
import { tariff } from "../../src/lib/fare";
import type { GetGroupsResponse, RoomState, StoredGroup } from "../../src/lib/types";

const station = process.env.E2E_STATION ?? "ramwadi";
const room = `/api/rooms/${station}`;

// Real Viman Nagar / Kalyani Nagar points, all east of Ramwadi.
const riders = [
  { name: "E2E Marketcity", destText: "Phoenix Marketcity, Viman Nagar", lat: 18.5622, lon: 73.9167 },
  { name: "E2E Kalyani", destText: "Kalyani Nagar", lat: 18.5463, lon: 73.9033 },
  { name: "E2E Symbiosis", destText: "Symbiosis, Viman Nagar", lat: 18.564, lon: 73.9136 },
];

test.describe.configure({ mode: "serial" });

async function reset(request: APIRequestContext) {
  const res = await request.post(`${room}/reset`);
  expect(res.status(), "reset").toBe(200);
}

test.beforeAll(async ({ playwright }) => {
  const request = await playwright.request.newContext({ baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000" });
  await reset(request);
  await request.dispose();
});

test.afterAll(async ({ playwright }) => {
  const request = await playwright.request.newContext({ baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000" });
  await reset(request);
  await request.dispose();
});

test("form does not need a board key", async ({ request }) => {
  const res = await request.post(`${room}/form`);
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual([]);
});

test("a point outside Pune is rejected", async ({ request }) => {
  const res = await request.post(`${room}/riders`, {
    data: { destText: "Mumbai", lat: 19.076, lon: 72.8777 },
  });
  expect(res.status()).toBe(400);
});

test("three riders join, form groups, and every share is fair", async ({ request }) => {
  const ids: string[] = [];
  for (const rider of riders) {
    const res = await request.post(`${room}/riders`, { data: rider });
    expect(res.status()).toBe(200);
    const { riderId } = (await res.json()) as { riderId: string };
    expect(riderId).toMatch(/^[0-9a-f-]{36}$/i);
    ids.push(riderId);
  }

  await expect
    .poll(
      async () => {
        const state = (await (await request.get(`${room}/state`)).json()) as RoomState;
        return state.waiting.length;
      },
      { timeout: 40_000 },
    )
    .toBe(0);

  const formed = ((await (await request.get(`${room}/groups`)).json()) as GetGroupsResponse).map((item) => item.data);

  const seen = new Map<string, string>();
  for (const id of ids) {
    const res = await request.get(`${room}/state?rider=${id}`);
    expect(res.status()).toBe(200);
    const state = (await res.json()) as RoomState;
    const group = state.group;
    expect(group, `rider ${id} has a group`).not.toBeNull();
    if (!group) continue;

    expect(group.riderIds, "rider is in their own group").toContain(id);
    expect(group.riderIds.length).toBeLessThanOrEqual(3);
    expect(group.meetAt, "meetAt present").toBeTruthy();

    const sum = group.perRider.reduce((acc, m) => acc + m.share, 0);
    const mine = group.perRider.find((m) => m.id === id);
    expect(mine, "rider has a perRider entry").toBeDefined();
    for (const m of group.perRider) {
      expect(m.share, `share of ${m.id} <= solo fare`).toBeLessThanOrEqual(m.soloFare);
      expect(Number.isInteger(m.share)).toBe(true);
    }
    // Shares sum to the group total fare: the sum is the same for every member, and equals one group fare.
    expect(sum).toBe(tariff(group.totalKm, new Date()));
    const stored = formed.find((g) => g.riderIds.includes(id));
    expect(stored, "form response contains the rider").toBeDefined();
    expect(stored?.perRider.reduce((acc, m) => acc + m.share, 0)).toBe(sum);

    // Exactly one group per rider: no rider id appears under two different groups.
    const key = [...group.riderIds].sort().join("|");
    seen.set(id, key);
    for (const other of group.riderIds) {
      if (seen.has(other)) expect(seen.get(other)).toBe(key);
    }
  }

  // Every rider appears in exactly one group in the form response.
  for (const id of ids) {
    expect(formed.filter((g) => g.riderIds.includes(id))).toHaveLength(1);
  }
  expect(formed.flatMap((g) => g.riderIds).sort()).toEqual([...ids].sort());

  const after = (await (await request.get(`${room}/state`)).json()) as RoomState;
  expect(after.waiting).toHaveLength(0);
});

test("two riders the same way auto-form, a driver accepts, the next driver sees taken", async ({ request }) => {
  expect((await request.post(`${room}/reset`)).status()).toBe(200);
  const pair = [
    { name: "Phoenix", destText: "Phoenix Marketcity, Viman Nagar", lat: 18.5622, lon: 73.9167 },
    { name: "Symbiosis", destText: "Symbiosis Viman Nagar", lat: 18.564, lon: 73.9136 },
  ];
  const ids: string[] = [];
  for (const rider of pair) {
    const res = await request.post(`${room}/riders`, { data: rider });
    expect(res.status()).toBe(200);
    ids.push(((await res.json()) as { riderId: string }).riderId);
  }

  let groupId = "";
  await expect
    .poll(
      async () => {
        const states = await Promise.all(
          ids.map(async (id) => (await (await request.get(`${room}/state?rider=${id}`)).json()) as RoomState),
        );
        const group = states[0]?.group;
        if (!group || states.some((state) => !state.group)) return "";
        const listed = (await (await request.get(`${room}/groups`)).json()) as GetGroupsResponse;
        const stored = listed.find((item) => item.data.riderIds.includes(ids[0]));
        groupId = stored?.id ?? "";
        return states.every((state) => state.group && state.group.perRider.some((member) => member.share > 0))
          ? groupId
          : "";
      },
      { timeout: 40_000 },
    )
    .not.toBe("");

  const before = (await (await request.get(`${room}/state?rider=${ids[0]}`)).json()) as RoomState;
  expect(before.group?.riderIds.sort()).toEqual([...ids].sort());
  for (const id of ids) {
    const state = (await (await request.get(`${room}/state?rider=${id}`)).json()) as RoomState;
    const mine = state.group?.perRider.find((member) => member.id === id);
    expect(mine?.share).toBeGreaterThan(0);
    expect(mine!.share).toBeLessThanOrEqual(mine!.soloFare);
  }

  const won = await request.post(`${room}/groups/${groupId}/accept`);
  expect(won.status()).toBe(200);
  const accepted = (await won.json()) as StoredGroup;
  expect(accepted.data.acceptedAt).toBeTruthy();

  await expect
    .poll(
      async () => {
        const state = (await (await request.get(`${room}/state?rider=${ids[1]}`)).json()) as RoomState;
        return state.group?.acceptedAt ?? "";
      },
      { timeout: 15_000 },
    )
    .not.toBe("");

  const taken = await request.post(`${room}/groups/${groupId}/accept`);
  expect(taken.status()).toBe(409);
});

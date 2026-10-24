import { expect, test, type APIRequestContext } from "@playwright/test";
import { tariff } from "../../src/lib/fare";
import type { FormGroupsResponse, RoomState } from "../../src/lib/types";

const boardKey = process.env.E2E_BOARD_KEY;
const room = "/api/rooms/ramwadi";

// Real Viman Nagar / Kalyani Nagar points, all east of Ramwadi.
const riders = [
  { name: "E2E Marketcity", destText: "Phoenix Marketcity, Viman Nagar", lat: 18.5622, lon: 73.9167 },
  { name: "E2E Kalyani", destText: "Kalyani Nagar", lat: 18.5463, lon: 73.9033 },
  { name: "E2E Symbiosis", destText: "Symbiosis, Viman Nagar", lat: 18.564, lon: 73.9136 },
];

test.describe.configure({ mode: "serial" });
test.skip(!boardKey, "E2E_BOARD_KEY is not set; the API suite resets and forms the live room, so it needs the board key.");

const keyHeader = { "x-board-key": boardKey ?? "" };

async function reset(request: APIRequestContext) {
  const res = await request.post(`${room}/reset`, { headers: keyHeader });
  expect(res.status(), "reset with the board key").toBe(200);
}

test.beforeAll(async ({ playwright }) => {
  if (!boardKey) return;
  const request = await playwright.request.newContext({ baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000" });
  await reset(request);
  await request.dispose();
});

test.afterAll(async ({ playwright }) => {
  if (!boardKey) return;
  const request = await playwright.request.newContext({ baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000" });
  await reset(request);
  await request.dispose();
});

test("form without the board key is rejected", async ({ request }) => {
  const none = await request.post(`${room}/form`);
  expect(none.status()).toBe(403);
  const wrong = await request.post(`${room}/form`, { headers: { "x-board-key": `${boardKey}-wrong` } });
  expect(wrong.status()).toBe(403);
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

  const before = (await (await request.get(`${room}/state`)).json()) as RoomState;
  expect(before.waiting).toHaveLength(3);
  expect(before.group).toBeNull();
  expect(before.sameWay).toEqual([]);

  const formRes = await request.post(`${room}/form`, { headers: keyHeader });
  expect(formRes.status()).toBe(200);
  const formed = (await formRes.json()) as FormGroupsResponse;
  expect(formed.length).toBeGreaterThan(0);

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

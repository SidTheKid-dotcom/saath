/** Smoke test: tsx scripts/smoke.ts <baseUrl>. Resets the ramwadi room. */
import { tariff } from "../src/lib/fare";
import type { FormGroupsResponse, JoinRoomResponse, RoomState } from "../src/lib/types";

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const room = `${base}/api/rooms/ramwadi`;
const failures: string[] = [];
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? "PASS" : "FAIL"} ${msg}`);
  if (!ok) failures.push(msg);
};

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${url} -> ${res.status}`);
  return (await res.json()) as T;
}

const riders = [
  { name: "smoke-1", destText: "Viman Nagar", lat: 18.5679, lon: 73.9143 },
  { name: "smoke-2", destText: "Viman Nagar Phoenix", lat: 18.5622, lon: 73.9169 },
  { name: "smoke-3", destText: "Symbiosis Viman Nagar", lat: 18.5714, lon: 73.9108 },
];

async function waitForGroups(ids: string[]): Promise<RoomState[]> {
  const deadline = Date.now() + 30_000;
  let last: RoomState[] = [];
  while (Date.now() < deadline) {
    last = await Promise.all(ids.map((id) => call<RoomState>(`${room}/state?rider=${id}`)));
    if (last.every((state) => state.group)) return last;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return last;
}

async function run() {
  await call(`${room}/reset`, { method: "POST" });
  const ids: string[] = [];
  for (const rider of riders) {
    const joined = await call<JoinRoomResponse>(`${room}/riders`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(rider),
    });
    check(typeof joined.riderId === "string" && joined.riderId.length > 0, `join ${rider.name}`);
    ids.push(joined.riderId);
  }

  const open = await fetch(`${room}/form`, { method: "POST" });
  check(open.status === 200, `form without a key is allowed (${open.status})`);

  const states = await waitForGroups(ids);
  const groups = states.map((state) => state.group).filter((group) => group !== null);
  check(groups.length === ids.length, "every rider has a group");
  const seen = new Map<string, string>();
  for (const group of groups) {
    if (!group) continue;
    check(group.riderIds.length <= 3, `group size <= 3 (${group.riderIds.length})`);
    const sum = group.perRider.reduce((total, member) => total + member.share, 0);
    check(sum === tariff(group.totalKm, new Date()), `shares sum to the metered fare (${sum})`);
    check(group.perRider.every((member) => member.share <= member.soloFare), "no share > soloFare");
    check(typeof group.meetAt === "string" && group.meetAt.length > 0, "meetAt set");
    const key = [...group.riderIds].sort().join("|");
    for (const id of group.riderIds) {
      if (seen.has(id) && seen.get(id) !== key) check(false, "rider in two groups");
      seen.set(id, key);
    }
  }
  check(ids.every((id) => seen.has(id)), "every joined rider is grouped");

  const formed = await call<FormGroupsResponse>(`${room}/form`, { method: "POST" });
  check(Array.isArray(formed), "form still answers after the room has settled");
  const recent = await call<unknown[]>(`${room}/groups`);
  check(Array.isArray(recent) && recent.length >= 1, "groups endpoint lists groups");
}

run()
  .catch((error) => check(false, `error: ${error instanceof Error ? error.message : error}`))
  .finally(async () => {
    try {
      await call(`${room}/reset`, { method: "POST" });
      console.log("reset done");
    } catch (error) {
      console.log(`reset failed: ${error instanceof Error ? error.message : error}`);
      failures.push("reset failed");
    }
    if (failures.length) {
      console.log(`${failures.length} failure(s)`);
      process.exit(1);
    }
    console.log("smoke OK");
  });

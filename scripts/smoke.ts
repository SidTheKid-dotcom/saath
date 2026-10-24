/** Smoke test: tsx scripts/smoke.ts <baseUrl>. Needs BOARD_KEY in env or .env.local. */
import { readFileSync } from "node:fs";
import type { FormGroupsResponse, JoinRoomResponse } from "../src/lib/types";

function boardKey(): string {
  if (process.env.BOARD_KEY) return process.env.BOARD_KEY;
  try {
    const m = readFileSync(".env.local", "utf8").match(/^BOARD_KEY=(.*)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {}
  return "";
}

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const key = boardKey();
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

async function run() {
  await call(`${room}/reset`, { method: "POST", headers: { "x-board-key": key } });
  const ids: string[] = [];
  for (const r of riders) {
    const j = await call<JoinRoomResponse>(`${room}/riders`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(r),
    });
    check(typeof j.riderId === "string" && j.riderId.length > 0, `join ${r.name}`);
    ids.push(j.riderId);
  }
  const noKey = await fetch(`${room}/form`, { method: "POST" });
  check(noKey.status === 401 || noKey.status === 403, `form without key rejected (${noKey.status})`);

  const groups = await call<FormGroupsResponse>(`${room}/form`, {
    method: "POST",
    headers: { "x-board-key": key },
  });
  const grouped = groups.flatMap((g) => g.riderIds);
  check(ids.every((id) => grouped.filter((x) => x === id).length === 1), "every rider in exactly one group");
  check(grouped.length === ids.length, "no extra riders in groups");
  for (const g of groups) {
    check(g.riderIds.length <= 3, `group size <= 3 (${g.riderIds.length})`);
    const sum = g.perRider.reduce((s, p) => s + p.share, 0);
    const total = g.perRider.length === 1 ? g.perRider[0].soloFare : sum;
    check(sum === total, `shares sum to total (${sum})`);
    check(g.perRider.every((p) => p.share <= p.soloFare), "no share > soloFare");
    check(typeof g.meetAt === "string" && g.meetAt.length > 0, "meetAt set");
  }
  const st = await call<{ group: { riderIds: string[] } | null }>(`${room}/state?rider=${ids[0]}`);
  check(st.group !== null, "state returns group for rider 1");
  const recent = await call<unknown[]>(`${room}/groups`);
  check(Array.isArray(recent) && recent.length >= groups.length, "groups endpoint lists groups");
}

run()
  .catch((e) => check(false, `error: ${e instanceof Error ? e.message : e}`))
  .finally(async () => {
    try {
      await call(`${room}/reset`, { method: "POST", headers: { "x-board-key": key } });
      console.log("reset done");
    } catch (e) {
      console.log(`reset failed: ${e instanceof Error ? e.message : e}`);
      failures.push("reset failed");
    }
    if (failures.length) {
      console.log(`${failures.length} failure(s)`);
      process.exit(1);
    }
    console.log("smoke OK");
  });

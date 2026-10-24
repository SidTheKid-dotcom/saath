/**
 * Worked example for README.md and docs/FAIRNESS.md. Rerun: npx tsx docs/worked-example.ts
 * Fixed inputs, no network: distances are the haversine x 1.35 fallback ("estimated"), and the clock is fixed.
 * The three riders are the same ones used in src/lib/grouping.test.ts (VIMAN_NAGAR_RIDERS).
 */
import { haversineMatrix } from "../src/lib/distance";
import { splitFare, tariff } from "../src/lib/fare";
import { formGroups } from "../src/lib/grouping";
import { getStation } from "../src/lib/stations";
import type { Group, RiderInput } from "../src/lib/types";

const station = getStation("ramwadi")!;
const noonIst = new Date("2026-10-24T06:30:00Z"); // 12:00 IST
const oneAmIst = new Date("2026-10-23T19:30:00Z"); // 01:00 IST

const riders: RiderInput[] = [
  { id: "c-datta", lat: 18.56772, lon: 73.91395 },
  { id: "a-near", lat: 18.561, lon: 73.9108 },
  { id: "b-mid", lat: 18.565, lon: 73.9128 },
];

const km = (n: number) => n.toFixed(2);

function show(title: string, groups: Group[], at: Date) {
  console.log(`\n${title}`);
  for (const g of groups) {
    const total = tariff(g.totalKm, at);
    console.log(
      `  auto: drop order ${g.riderIds.join(" -> ")} | route ${km(g.totalKm)} km | metered fare Rs ${total} | estimated=${g.estimated}`,
    );
    for (const m of g.perRider) {
      console.log(
        `    ${m.id.padEnd(8)} alone: ${km(m.soloKm)} km = Rs ${String(m.soloFare).padStart(3)} | in auto: rides ${km(m.rideKm)} km | pays Rs ${String(m.share).padStart(3)}`,
      );
    }
    console.log(`    shares sum to ${g.perRider.reduce((s, m) => s + m.share, 0)} (must equal the fare ${total})`);
  }
}

console.log("tariff(km) at noon IST:", [1, 1.5, 2, 6.3].map((k) => `${k} km = Rs ${tariff(k, noonIst)}`).join("; "));
console.log("tariff(2 km) at 01:00 IST (x1.25):", `Rs ${tariff(2, oneAmIst)}`);
console.log("splitFare(52, [30, 36, 52]) =", JSON.stringify(splitFare(52, [30, 36, 52])));

const matrix = haversineMatrix([station, ...riders]);
show("Three riders heading toward Viman Nagar, noon IST", formGroups(station, riders, matrix, noonIst), noonIst);
show("Same riders at 01:00 IST (night rate)", formGroups(station, riders, matrix, oneAmIst), oneAmIst);

const opposite: RiderInput[] = [
  riders[0],
  { id: "south-west", lat: 18.5475, lon: 73.8995 },
];
show(
  "One rider north-east, one south-west (opposite ways), noon IST",
  formGroups(station, opposite, haversineMatrix([station, ...opposite]), noonIst),
  noonIst,
);

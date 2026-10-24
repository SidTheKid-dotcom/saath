# Saath

Shared autos from a Pune Metro exit: Saath groups riders who are going the same way (at most 3 per auto) and splits one legal metered fare between them, so nobody's share is higher than riding alone.

Built with Codex at Codex Dayline, Pune Metro, 24 Oct 2026.

- Live: https://saath-bice.vercel.app (no sign-in). Rider page: [/ramwadi](https://saath-bice.vercel.app/ramwadi). Board screen: [/ramwadi/board](https://saath-bice.vercel.app/ramwadi/board).
- Repo: https://github.com/SidTheKid-dotcom/saath
- Rules in one file: [CONTRACT.md](CONTRACT.md). Why no one pays more than alone: [docs/FAIRNESS.md](docs/FAIRNESS.md).

## The problem

- Since 1 Sep 2026 the legal metered auto fare in Pune is ₹30 for the first 1.5 km plus ₹20 per extra km (rule and sources in the Fare section of [CONTRACT.md](CONTRACT.md): HT 2 Sep 2026, FPJ 3 Sep 2026).
- From the team's field notes (not independently sourced here): shared-auto feeder routes from Metro stations were approved in Aug 2026, but there was no tool to coordinate the riders at an exit.
- Riders going the same way split a fare by arguing at the exit. Saath does the grouping and the arithmetic with fixed, published rules, so the split is the same for everyone and can be checked.

## 60-second demo path

1. Open [/ramwadi/board](https://saath-bice.vercel.app/ramwadi/board) on a big screen. It shows a QR code to the rider page and the live count of waiting riders.
2. On a phone, scan the QR code (or open [/ramwadi](https://saath-bice.vercel.app/ramwadi)), type a destination (Metro stations are suggested first), pick a suggestion, optionally add a phone number, and tap "Yes, drop me here".
3. The phone shows a waiting screen (it polls the server every 3 s, per CONTRACT.md).
4. On the board, press **Form groups**. The board asks for the board key once (a browser prompt, then kept in that browser's local storage) and sends it as `x-board-key`; the demo operator holds the key.
5. The phone shows the group card: drop order, "You pay ₹X of ₹Y", the meeting gate, and a driver card in Marathi and English listing the stops and the total meter fare. A pill reads "Estimated road distance" when the distances are estimates.

The room is per station and holds riders from the last 3 hours.

## How the fair split works

Code: [`src/lib/fare.ts`](src/lib/fare.ts), [`src/lib/grouping.ts`](src/lib/grouping.ts). Full rules and argument: [docs/FAIRNESS.md](docs/FAIRNESS.md).

1. `tariff(km, at)`: ₹30 up to 1.5 km, else 30 + 20 × (km − 1.5); × 1.25 between 00:00 and 04:59 IST; rounded to the rupee.
2. Each rider's *solo fare* is `tariff` of the road distance from the station to their destination.
3. Riders are grouped when they are heading the same way (within 45° of the farthest rider's bearing) and nobody's ride grows by more than min(25%, 1.5 km).
4. The auto's fare is `tariff` of the whole route (station → first drop → second drop → third drop).
5. `splitFare` divides that fare in proportion to the solo fares, rounds each share down to the rupee, and gives the leftover rupees to the rider with the largest solo fare. A group is only accepted if every share is ≤ that rider's solo fare.

Worked example, produced by running [`docs/worked-example.ts`](docs/worked-example.ts) (fixed riders, noon IST, estimated distances, no network). Rerun it with `npx tsx docs/worked-example.ts`.

```
Three riders heading toward Viman Nagar, noon IST
  auto: drop order a-near -> b-mid -> c-datta | route 1.78 km | metered fare Rs 36 | estimated=true
    a-near   alone: 0.68 km = Rs  30 | in auto: rides 0.68 km | pays Rs  11
    b-mid    alone: 1.34 km = Rs  30 | in auto: rides 1.34 km | pays Rs  11
    c-datta  alone: 1.78 km = Rs  36 | in auto: rides 1.78 km | pays Rs  14
    shares sum to 36 (must equal the fare 36)

One rider north-east, one south-west (opposite ways), noon IST
  auto: drop order south-west | route 1.93 km | metered fare Rs 39 | estimated=true
    south-west alone: 1.93 km = Rs  39 | in auto: rides 1.93 km | pays Rs  39
  auto: drop order c-datta | route 1.78 km | metered fare Rs 36 | estimated=true
    c-datta  alone: 1.78 km = Rs  36 | in auto: rides 1.78 km | pays Rs  36
```

The same riders at 01:00 IST pay ₹14 / ₹14 / ₹17 of a ₹45 fare (full output in the script). Together the three riders pay ₹36 instead of ₹96 alone (30 + 30 + 36). That relies on one meter fare for the whole route; whether a driver agrees to run the trip that way is outside what this code can check (see [Limitations](#limitations)).

## Guarantees

Each row names where the rule is enforced and a test that checks it. Test names are from the files as of this commit. `expectInvariants` is a helper in [`src/lib/grouping.test.ts`](src/lib/grouping.test.ts) (line 60) that asserts every row marked * on each group returned by the tests listed.

| Guarantee | Enforced in | Test |
|---|---|---|
| Every rider is in exactly one group * | `formGroups` loop over `ungrouped` in [`grouping.ts`](src/lib/grouping.ts) | `formGroups > (c) satisfies every invariant for 7 seeded random riders around Ramwadi` (200 seeds); `formGroupsRouted > (d) groups 250 seeded riders in under 2 s…` |
| At most 3 riders per auto * | `MAX_GROUP = 3` (`grouping.ts:11`) | same tests |
| Shares sum exactly to the fare for the whole route * | `splitFare` in [`fare.ts`](src/lib/fare.ts) | `splitFare > always sums exactly to the total (seeded property test)` (5000 cases); `expectInvariants` |
| No rider pays more than their solo fare * | `price()` sets `ok` only if `shares[k] <= soloFares[k]` (`grouping.ts:192-200`); a failing order is never accepted | `expectInvariants` (`m.share <= m.soloFare`, line 83) in tests (a), (c), (d) and the routed tests |
| A rider's ride is at most min(1.25 × solo km, solo km + 1.5 km) * | same `price()` check | `formGroups > refuses a candidate whose detour breaks rule 5` |
| Only riders within 45° of the seed's bearing are paired | `SAME_WAY_DEG` filter (`grouping.ts:12`) | `formGroups > only pairs riders within 45° of the seed's bearing, even when the detour would be fine`; `(b) keeps 2 opposite-direction riders solo` |
| A lone rider pays exactly their solo fare * | `expectInvariants` branch for group size 1 | `(b) keeps 2 opposite-direction riders solo` |
| Same input gives the same groups | no randomness; ties broken by smaller id | `formGroups > seeds with the farthest rider, breaks ties by smaller id, and is deterministic` |
| Fare: ₹30 to 1.5 km, ₹20/km after, ×1.25 from 00:00 to 04:59 IST | `tariff` in `fare.ts` | `tariff > charges the ₹30 minimum up to 1.5 km`, `adds ₹20 per km after 1.5 km, rounded to the rupee`, `applies ×1.25 at 01:00 IST`, `has no multiplier from 05:00 IST, and still has it at 04:59 IST` |
| If the road-distance service fails, the group is labelled estimated | `distance.ts` (4 s timeout, haversine × 1.35 fallback); `formGroupsRouted` | `distanceMatrix > falls back to haversine × 1.35 when fetch throws`, `falls back after the 4 s timeout`; `formGroupsRouted > marks groups estimated when OSRM is down` |
| A group that breaks the rules on real road legs is split | `recheck()` in `grouping.ts` | `formGroupsRouted > splits a group whose real legs break the rules, keeping a passing prefix` |
| Forming groups and resetting a room need the board key | `checkBoardKey` in [`src/app/api/_lib/room.ts`](src/app/api/_lib/room.ts) | `routes.test.ts`: `form > requires the board key`, `groups and reset > reset needs key` |
| Destinations outside the Pune box (lon 73.70–74.05, lat 18.40–18.70) are rejected | `inBbox` in `room.ts`, used by [`riders/route.ts`](src/app/api/rooms/[station]/riders/route.ts) | `routes.test.ts`: `riders > rejects points outside bbox` |
| The words banned by CONTRACT.md "Words" are absent from UI copy, English and Marathi | [`src/content/copy.ts`](src/content/copy.ts) | `copy > never uses banned words in either language` |

What these checks do not cover: the solo fares are computed from the app's own distances (OSRM road distance, or the labelled estimate). A real meter can read differently.

## Verify it yourself

Needs Node 22 or newer (CONTRACT.md names Node 24). Tests and build need no database or keys.

```bash
git clone https://github.com/SidTheKid-dotcom/saath && cd saath
npm ci
npm test            # vitest run
npm run build       # next build
npx tsx docs/worked-example.ts   # reprints the worked example above
```

`npm test` at this commit: **62 tests passed in 7 test files** (`npx vitest run`, run 24 Oct 2026). `npm run build` completes and lists the routes `/`, `/[station]`, `/[station]/board` and the six API routes. `npm run check` runs lint, tests and build together.

Smoke test against a running server: `npx tsx scripts/smoke.ts http://localhost:3000` ([`scripts/smoke.ts`](scripts/smoke.ts)). It joins three riders, forms groups, checks the invariants above over HTTP, and then calls `reset` on the `ramwadi` room. It needs `BOARD_KEY` in the environment or `.env.local`, and `reset` marks that room's riders and groups as old, so run it only against your own local or test deployment, not against the live demo.

To run the app locally you need a Postgres database (Neon): set `DATABASE_URL` and `BOARD_KEY` in `.env.local`, run `npm run migrate` ([`sql/001_init.sql`](sql/001_init.sql)), then `npm run dev`. `GOOGLE_MAPS_SERVER_KEY` is optional; without it, search uses Photon only.

## Architecture

- **Next.js App Router** (TypeScript, CSS modules). Pages: [`src/app/[station]/page.tsx`](src/app/[station]/page.tsx) (rider), [`src/app/[station]/board/page.tsx`](src/app/[station]/board/page.tsx) (board). Components in `src/components/rider/` and `src/components/board/`. UI text, English and Marathi, in [`src/content/copy.ts`](src/content/copy.ts).
- **Neon Postgres** via `@neondatabase/serverless` ([`src/lib/db.ts`](src/lib/db.ts)); tables `riders` and `groups` in [`sql/001_init.sql`](sql/001_init.sql).
- **API routes** in `src/app/api/`: `geocode`, and per station `riders`, `state`, `form`, `groups`, `reset`. Shapes are in CONTRACT.md and [`src/lib/types.ts`](src/lib/types.ts).
- **Map**: MapLibre GL with the OpenFreeMap "liberty" style; board map in [`BoardMap.tsx`](src/components/board/BoardMap.tsx), pin confirmation in [`PinMap.tsx`](src/components/rider/PinMap.tsx).
- **Distances** ([`src/lib/distance.ts`](src/lib/distance.ts)): the public OSRM server (`router.project-osrm.org`) with a 4 s timeout; on any failure, straight-line distance × 1.35, labelled "estimated". "Form groups" ([`form/route.ts`](src/app/api/rooms/[station]/form/route.ts)) calls `formGroupsRouted`, which screens with the estimate and then makes one OSRM route call per group of 2–3 and per solo rider (4 at a time).
- **Geocoding** ([`geocode/route.ts`](src/app/api/geocode/route.ts)): Google Places text search when `GOOGLE_MAPS_SERVER_KEY` is set (results kept only inside the Pune box); otherwise, or on error or no results, Photon (`photon.komoot.io`). The code itself has no rate limit; the Google key is restricted to the Places API and capped at 150 text searches per day in the Google Cloud project (inside the free tier), and a refused request falls back to Photon like any other error.
- **Stations** ([`src/lib/stations.ts`](src/lib/stations.ts)): Ramwadi (Gate 2, Gate 3) and Vanaz, from OpenStreetMap, read 2026-10-24.

## Privacy and access

- No accounts. A rider optionally gives a name; the code stores the name, the destination text and its coordinates, and a random rider id (kept in the browser's storage).
- Phone number is optional. It is validated and stored as +91XXXXXXXXXX ([`src/lib/phone.ts`](src/lib/phone.ts)) and returned only to riders in the same formed group, as tap-to-call links ([`state/shape.ts`](src/app/api/rooms/%5Bstation%5D/state/shape.ts), tested in `shape.test.ts`). It never appears in the waiting lists, in `/groups`, `/form` or on the board. (Applies once PR #19 is merged; until then no phone is collected.)
- Riders count as part of a room for 3 hours after they join (`interval '3 hours'` in the `state`, `form` and `groups` queries; CONTRACT.md "Room"). After that they no longer appear in the room. Rows are not deleted: `reset` only moves their timestamp a day back, and nothing else purges them.
- Not private: `GET /api/rooms/{station}/state` and `/groups` are open, and they return each waiting rider's name (if given), destination text and coordinates. The board is meant to be shown in public, and the rider endpoints are not protected by a login.
- The group card and the driver card list the group's drop stops (the riders' destination text) with each stop's share, so riders in the same group see where the others get off.
- `form` and `reset` require the board key (`x-board-key`, compared with the `BOARD_KEY` environment variable).

## Limitations

- Distances come from the public OSRM demo server, which has no uptime commitment. When it fails or is slow, groups are priced on straight-line × 1.35 estimates and are labelled "estimated".
- In the routed path, a later rider's solo distance is scaled from the first leg's real/estimated ratio rather than routed separately (explained in the comment above `recheck` in `grouping.ts`).
- The 250-rider result is a test with a mocked OSRM, not a measurement against the real server.
- Rooms are per station and only Ramwadi and Vanaz exist. Ramwadi's meeting gate is assigned round-robin per group (Gate 2, Gate 3), not by where the group is heading.
- Grouping is greedy (seed with the farthest rider, add the cheapest compatible rider), not an optimal matching. A group is one auto with at most 3 riders.
- Saath computes a fare split. It does not talk to drivers, and does not make a driver run the meter for the whole trip.
- Fares follow the rule in CONTRACT.md. If the tariff changes, `fare.ts` needs to change.
- The smoke script and tests use fixed Pune coordinates; the app has not been tested at scale on real riders.

## Words

The product says "shared auto", "your share", "legal metered fare (₹30 + ₹20/km, from 1 Sep 2026)" and "estimated road distance". Saath is an independent project with no tie to any transport authority, and it makes no promise about what a driver will do. It matches riders at an exit and splits one fare; it does not plan journeys.

## AI tools and credits

The code was written with AI coding agents (the event line above names Codex). Data and services: OpenStreetMap contributors (station points), OpenFreeMap and MapLibre (map), OSRM public server (road distances), Photon / Komoot and Google Places (search), Neon (Postgres), Vercel (hosting). Libraries are listed in [`package.json`](package.json).

# Saath: shared autos from a Pune Metro exit, with a fair split of the legal fare

**Live:** https://saath-bice.vercel.app (no sign-in) · Track: Urban Mobility

Saath groups riders leaving the same Metro exit who are going the same way (at most 3 per auto) and splits one legal metered fare so nobody pays more than riding alone.

Built at Codex Dayline, Pune Metro, 24 Oct 2026. Repo: https://github.com/SidTheKid-dotcom/saath. Rules: [CONTRACT.md](CONTRACT.md). Why no one pays more than alone: [docs/FAIRNESS.md](docs/FAIRNESS.md). An AI reviewer should start at [AGENTS.md](AGENTS.md).

## Try it in 30 seconds

- Rider: https://saath-bice.vercel.app/vanaz — type where you are going and tap "Yes, drop me here".
- Board (projector): https://saath-bice.vercel.app/vanaz/board — QR code, waiting count, groups as they form. No button and no key.
- Driver: https://saath-bice.vercel.app/vanaz/driver — accept a group. The first accept wins.

Use **Vanaz** for the two-rider demo below. The same two places from Ramwadi stay solo: the road detour is just over the 25% cap (see [Limitations](#limitations)).

## The problem

- Since 1 Sep 2026 the legal metered auto fare in Pune is ₹30 for the first 1.5 km plus ₹20 per extra km (sources in the Fare section of [CONTRACT.md](CONTRACT.md): HT 2 Sep 2026, FPJ 3 Sep 2026).
- From the team's field notes (not independently sourced here): shared-auto feeder routes from Metro stations were approved in Aug 2026, but there was no tool to coordinate the riders at an exit.
- Riders going the same way split a fare by arguing at the exit. Saath does the grouping and the arithmetic with fixed, published rules, so the split is the same for everyone and can be checked.

## Real-world impact

| Person | Decision | What Saath gives them |
|---|---|---|
| Rider stepping off the Metro | Share an auto, or ride alone? | A group that forms on its own, a share that is never above the solo fare, and a gate to stand at. |
| Auto driver at the exit | Which group do I take? | A list in Marathi and English, the stops, the total meter fare, and a first-wins accept. |
| Station staff / a judge on a projector | What is happening at this gate? | A board with a QR code, the waiting count, and each group's route. No operator step. |

In the worked example below, three riders pay ₹36 together instead of ₹96 alone (₹30 + ₹30 + ₹36). That figure comes from [`docs/worked-example.ts`](docs/worked-example.ts), not from live riders. A driver still has to agree to run one meter for the whole trip.

## 60-second judge walkthrough

Two riders and one driver, on Vanaz. No account and no board key. Groups form about 8 seconds after the later rider joins.

1. On a laptop, open https://saath-bice.vercel.app/vanaz/board. You see a QR code to the rider page and "No groups yet" until people join.
2. Phone A: open https://saath-bice.vercel.app/vanaz. The destination field is already focused. Type `Phoenix Marketcity Viman Nagar`, tap the first suggestion, then tap **Yes, drop me here**. A phone number is optional and stays behind "Add your number".
3. Phone B: open the same Vanaz page. Type `Symbiosis Viman Nagar`, tap the first suggestion, and confirm the same way.
4. Both phones show "Wait at Station exit" and poll every 3 seconds. Keep them open. When the newer rider has been waiting 8 seconds, both phones switch to the group card: drop order, "You pay ₹X" of one meter fare, and the meeting point. If the distance service failed, the card says "Estimated road distance".
5. Driver phone: open https://saath-bice.vercel.app/vanaz/driver (or tap the yellow **I'm driving** pill on the rider page). The group is listed with both stops and the total meter fare. Tap **Accept this group**.
6. Both rider phones show "An auto has accepted your group." A second driver who opens the same driver page sees **Taken**. A second tap to accept returns 409.

The room is one station and holds riders from the last 3 hours. Do not press reset on a live station.

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
| Groups form on their own, and two polls cannot double-form the same riders | `formingReady` in [`src/lib/autoform.ts`](src/lib/autoform.ts) (8 s after the newest join when 2+ are waiting; 60 s for a lone rider); `tryFormRoom` in [`src/app/api/_lib/formRoom.ts`](src/app/api/_lib/formRoom.ts) takes `form_locks` and stores only riders still ungrouped | `autoform > a pair forms once the newest rider has waited 8s`, `a lone rider forms only after 60s`; `formRoom > does not form a fresh single rider`, `stores one group for a settled pair and releases the lock`, `does nothing when another call holds the lock`; `routes.test.ts`: `form > forms without a board key` |
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

`npm test` at this commit: **101 tests passed in 16 test files** (`npx vitest run`, run 24 Oct 2026). `npm run build` completes and lists the routes `/`, `/[station]`, `/[station]/board`, `/[station]/driver` and the API routes. `npm run check` runs lint, tests and build together. `npm run typecheck` is `tsc --noEmit`.

Smoke test against a running server: `npx tsx scripts/smoke.ts http://localhost:3000` ([`scripts/smoke.ts`](scripts/smoke.ts)). It joins three riders, waits until groups form on their own, checks the invariants above over HTTP, and then calls `reset` on the `ramwadi` room. `reset` marks that room's riders and groups as old, so run it only against your own local or test deployment, not against the live demo. The browser suite is `npm run e2e` (Playwright, Chrome). It needs `DATABASE_URL` and a running server. Set `E2E_STATION` to an unused station slug when the live Ramwadi room should be left alone.

To run the app locally you need a Postgres database (Neon): set `DATABASE_URL` in `.env.local`, run `npm run migrate` ([`sql/001_init.sql`](sql/001_init.sql), [`sql/002_rider_phone.sql`](sql/002_rider_phone.sql), [`sql/003_form_lock.sql`](sql/003_form_lock.sql)), then `npm run dev`. `GOOGLE_MAPS_SERVER_KEY` is optional; without it, search uses Photon only. No board key is required.

## Architecture

- **Next.js App Router** (TypeScript, CSS modules). Pages: [`src/app/[station]/page.tsx`](src/app/[station]/page.tsx) (rider), [`src/app/[station]/driver/page.tsx`](src/app/[station]/driver/page.tsx) (driver), [`src/app/[station]/board/page.tsx`](src/app/[station]/board/page.tsx) (board). UI text, English and Marathi, in [`src/content/copy.ts`](src/content/copy.ts).
- **Neon Postgres** via `@neondatabase/serverless` ([`src/lib/db.ts`](src/lib/db.ts)); tables `riders` and `groups` in [`sql/001_init.sql`](sql/001_init.sql), optional `phone` in [`sql/002_rider_phone.sql`](sql/002_rider_phone.sql), and `form_locks` in [`sql/003_form_lock.sql`](sql/003_form_lock.sql).
- **API routes** in `src/app/api/`: `geocode`, and per station `riders`, `state`, `form`, `groups`, `reset`. Shapes are in CONTRACT.md and [`src/lib/types.ts`](src/lib/types.ts).
- **Map**: MapLibre GL with the OpenFreeMap "liberty" style; board map in [`BoardMap.tsx`](src/components/board/BoardMap.tsx), pin confirmation in [`PinMap.tsx`](src/components/rider/PinMap.tsx).
- **Distances** ([`src/lib/distance.ts`](src/lib/distance.ts)): the public OSRM server (`router.project-osrm.org`) with a 4 s timeout; on any failure, straight-line distance × 1.35, labelled "estimated". Auto-forming ([`formRoom.ts`](src/app/api/_lib/formRoom.ts)) calls `formGroupsRouted`, which screens with the estimate and then makes one OSRM route call per group of 2–3 and per solo rider (4 at a time). It runs after a rider joins and on the rider, board and driver polls. A row lock stops two polls storing the same riders twice. `POST /form` uses the same settle rules and does not force a group early.
- **Geocoding** ([`geocode/route.ts`](src/app/api/geocode/route.ts)): Google Places text search when `GOOGLE_MAPS_SERVER_KEY` is set (results kept only inside the Pune box); otherwise, or on error or no results, Photon (`photon.komoot.io`). The code itself has no rate limit; the Google key is restricted to the Places API and capped at 150 text searches per day in the Google Cloud project (inside the free tier), and a refused request falls back to Photon like any other error.
- **Stations** ([`src/lib/stations.ts`](src/lib/stations.ts)): operational Pune Metro stations, from OpenStreetMap, read 2026-10-24. Ramwadi has Gate 2 and Gate 3. Vanaz uses the station point, labelled "Station exit". The judge demo uses Vanaz.

## Privacy and access

- No accounts. A rider optionally gives a name; the code stores the name, the destination text and its coordinates, and a random rider id (kept in the browser's storage).
- Phone number is optional. It is validated and stored as +91XXXXXXXXXX ([`src/lib/phone.ts`](src/lib/phone.ts)) and returned only to riders in the same formed group, as tap-to-call links ([`state/shape.ts`](src/app/api/rooms/%5Bstation%5D/state/shape.ts), tested in `shape.test.ts`). It never appears in the waiting lists, in `/groups`, `/form` or on the board.
- Riders count as part of a room for 3 hours after they join (`interval '3 hours'` in the `state`, `form` and `groups` queries; CONTRACT.md "Room"). After that they no longer appear in the room. Rows are not deleted: `reset` only moves their timestamp a day back, and nothing else purges them.
- Not private: `GET /api/rooms/{station}/state` and `/groups` are open, and they return each waiting rider's name (if given), destination text and coordinates. The board is meant to be shown in public, and the rider endpoints are not protected by a login.
- The group card and the driver card list the group's drop stops (the riders' destination text) with each stop's share, so riders in the same group see where the others get off.
- `form` and `reset` are open. There is no `BOARD_KEY`. `reset` still only ages the room (it does not delete rows), so do not call it against a live station that has waiting riders.

## Limitations

- Distances come from the public OSRM demo server, which has no uptime commitment. When it fails or is slow, groups are priced on straight-line × 1.35 estimates and are labelled "estimated".
- In the routed path, a later rider's solo distance is scaled from the first leg's real/estimated ratio rather than routed separately (explained in the comment above `recheck` in `grouping.ts`).
- The 250-rider result is a test with a mocked OSRM, not a measurement against the real server.
- Rooms are per station. A station with tagged exits assigns the meeting gate round-robin per group (Ramwadi: Gate 2, Gate 3), not by where the group is heading.
- Grouping is greedy (seed with the farthest rider, add the cheapest compatible rider), not an optimal matching. A group is one auto with at most 3 riders.
- A driver can see a group and accept it. Saath still does not make a driver run the meter for the whole trip.
- Fares follow the rule in CONTRACT.md. If the tariff changes, `fare.ts` needs to change.
- The smoke script and tests use fixed Pune coordinates; the app has not been tested at scale on real riders.
- Phoenix Marketcity and Symbiosis Viman Nagar share one auto from Vanaz. From Ramwadi the same two points stay solo, because the extra road distance is just over 25% of the solo trip. That is the fairness rule, not a missed button.

## CI and deploy

Pushes to `main` and pull requests run lint, typecheck, Vitest and `next build` in [`.github/workflows/ci.yml`](.github/workflows/ci.yml). The Vercel project `saath` is not linked to this GitHub repo (recent production deployments were created with the Vercel CLI, source `cli`, not a Git integration), so the same workflow is also the deploy path: a pull request gets a preview deploy after the checks pass, and a push to `main` deploys production. If the project is later connected to GitHub in the Vercel dashboard, delete the `deploy-preview` and `deploy-production` jobs so each push is not deployed twice.

Add these three repository secrets (GitHub → Settings → Secrets and variables → Actions). The check job does not need them. The deploy jobs fail until they exist.

| Secret | Value | Where to get it |
|---|---|---|
| `VERCEL_TOKEN` | A token for the account that owns the `saath` project | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | `team_AeXWoqsVBntEhucBarsFUXl0` | Team Settings, or `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | `prj_XcAepQcJRALs3TPTAz0dxb3f6PDz` | Project Settings → General (project name `saath`) |

`DATABASE_URL` is already set on the Vercel project for Production, Preview and Development. `vercel pull` in the deploy jobs reads it. Do not put it in GitHub.

## Judging criteria

| Criterion | What to look at |
|---|---|
| Technical implementation | Deterministic grouping and fare split in [`src/lib/grouping.ts`](src/lib/grouping.ts) and [`src/lib/fare.ts`](src/lib/fare.ts). Auto-form lock in [`src/app/api/_lib/formRoom.ts`](src/app/api/_lib/formRoom.ts). The [Guarantees](#guarantees) table names a test for each rule. `npm test` needs no database. |
| Innovation | Groups form with nobody pressing a button. A pair that would make someone ride too far, or pay more than alone, is refused and each person rides solo. |
| Track fit: Urban Mobility | The user is a commuter at a Pune Metro exit and an auto driver at that gate. The fare is the published Pune meter, not an invented price. |
| Completeness | Landing, rider, waiting, group card, driver list, accept, and projector board. English and Marathi. CI on every push and pull request. |
| Functionality | Live app, no sign-in: https://saath-bice.vercel.app/vanaz. The walkthrough above is the check: two riders, one shared fare, one driver accepts, the next driver sees Taken. |
| UI/UX | Phone-first. One obvious action per screen. 48px targets on the main controls. The destination opens immediately. Drivers get Marathi first. The board explains itself in one line. |
| Feasibility | No accounts. Postgres on Neon, hosting on Vercel, road distance from public OSRM with a labelled fallback. A driver still runs the meter. Saath does not dispatch a fleet. |
| Demo | The [60-second judge walkthrough](#60-second-judge-walkthrough). Use Vanaz, Phoenix Marketcity Viman Nagar, and Symbiosis Viman Nagar. |

## What is not built

Saath does not book an auto, take payment, track the ride, or talk to a meter. It does not cover cities outside the Pune box. See [Limitations](#limitations).

## Words

The product says "shared auto", "your share", "legal metered fare (₹30 + ₹20/km, from 1 Sep 2026)" and "estimated road distance". Saath is an independent project with no tie to any transport authority, and it makes no promise about what a driver will do. It matches riders at an exit and splits one fare; it does not plan journeys.

## AI tools and credits

The code was written with AI coding agents (the event line above names Codex). Data and services: OpenStreetMap contributors (station points), OpenFreeMap and MapLibre (map), OSRM public server (road distances), Photon / Komoot and Google Places (search), Neon (Postgres), Vercel (hosting). Libraries are listed in [`package.json`](package.json).

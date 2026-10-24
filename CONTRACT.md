# Saath contract (single source for all tasks; do not restate in task files)

## Stack
Next.js (App Router, TypeScript, `src/`), plain CSS modules (no Tailwind), `@neondatabase/serverless` for Postgres (env `DATABASE_URL`), `maplibre-gl` with OpenFreeMap style `https://tiles.openfreemap.org/styles/liberty`, Vitest for tests. Deploy target: Vercel project `saath`. Node 24.

## Stations (`src/lib/stations.ts`), from OpenStreetMap (read 2026-10-24)
| slug | name | lat | lon | exits |
|---|---|---|---|---|
| ramwadi | Ramwadi | 18.55703 | 73.90856 | Gate 2 (18.55761, 73.90907), Gate 3 (18.55727, 73.90928) |
| vanaz | Vanaz | 18.50719 | 73.80519 | none tagged → use station point, label "Station exit" |

## Distance (`src/lib/distance.ts`)
- `distanceMatrix(points)` → km matrix. Primary: OSRM table `https://router.project-osrm.org/table/v1/driving/{lon,lat;...}?annotations=distance`, 4 s timeout.
- Fallback on any error: haversine × 1.35. Return `{ km: number[][], estimated: boolean }`. The UI must show "estimated" when `estimated` is true.

## Fare (`src/lib/fare.ts`), sources: HT 2 Sep 2026, FPJ 3 Sep 2026
- `tariff(km, at: Date)`: ₹30 if km ≤ 1.5, else 30 + 20 × (km − 1.5). Multiply by 1.25 if the IST time is 00:00–04:59. Round to the nearest rupee.
- `splitFare(total, soloFares[])`: shares proportional to soloFares, each rounded down to the rupee; the remainder goes to the rider with the largest solo fare. Shares sum exactly to total.

## Grouping (`src/lib/grouping.ts`), pure and deterministic
Input: station point, riders `{id, lat, lon}`, distance matrix (index 0 = station). Output: groups `{riderIds (drop order), totalKm, legKm[], perRider: {id, soloKm, rideKm, soloFare, share, lat?, lon?, destText?}[], estimated}`.
1. soloKm(r) = matrix[0][r].
2. Seed = ungrouped rider with the largest soloKm (tie: smaller id).
3. Candidates = ungrouped riders whose bearing from the station is within 45° of the seed's.
4. Repeatedly add the candidate that adds the least total route km, while group size < 3. Drop order = best permutation (brute force, ≤ 3 drops).
5. Accept a candidate only if, for every member, rideKm (distance travelled from station to their drop in this order) ≤ min(soloKm × 1.25, soloKm + 1.5) AND share ≤ soloFare.
6. A group of 1 is "solo": share = soloFare.
Invariants (tests must check): every rider in exactly one group; group size ≤ 3; shares sum to tariff(totalKm); no share > soloFare.

## Data (Postgres)
- `riders(id uuid pk, station text, name text null, dest_text text, lat double, lon double, created_at timestamptz default now(), group_id uuid null, phone text null)`; `phone` added by `sql/002_rider_phone.sql` (`npm run migrate` applies every `sql/*.sql` in order, idempotent).
- `groups(id uuid pk, station text, created_at timestamptz, data jsonb)` where data = grouping output for that group + `meetAt` (exit label).
- Room = station + riders created in the last 3 hours with group_id null (waiting) or set (grouped).

## API (JSON)
- `GET /api/geocode?q=&station=` → up to 5 `{label, lat, lon}` from Photon `https://photon.komoot.io/api/?q=&lat=&lon=&limit=5&bbox=73.70,18.40,74.05,18.70` (bias to station).
- `POST /api/rooms/{station}/riders` `{name?, destText, lat, lon, phone?}` → `{riderId}`. Reject points outside the bbox. `phone` is an Indian mobile, normalised to `+91XXXXXXXXXX` (`src/lib/phone.ts`); invalid → 400. If the `phone` column is missing (migration not run) the insert retries without it.
- `GET /api/rooms/{station}/state?rider=` → `{waiting, sameWay, group | null, estimated}`. sameWay = waiting riders within 45° bearing of this rider. Without `rider` (board use): `waiting` filled, `sameWay: []`, `group: null`.
- Phone privacy: `group.perRider[].phone` is set only in `/state?rider=X` and only for members of X's own formed group (`state/shape.ts`, tested). Phones never appear in `waiting`, `sameWay`, `/groups`, `/form` output or stored group data.
- `POST /api/rooms/{station}/form` (header `x-board-key` = env `BOARD_KEY`) → runs grouping on all waiting riders, stores groups, returns them.
- `GET /api/rooms/{station}/groups` → recent groups for the board.
- `POST /api/rooms/{station}/reset` (board key) → marks the room's riders as old (for rehearsals).

## Pages
- `/{station}`: rider flow in 4 screens with progress dots (Where to, Confirm, Waiting, Your auto): destination input (autofocus; Metro stations from `stations` matched locally above geocode results) → map pin + optional phone + "Yes, drop me here" → waiting ("Wait at <first exit>", live counts, poll every 3 s) → group card: meet at Gate N, "You pay ₹X" of ₹Y, people with tel: Call buttons, driver card (Marathi + English, call buttons too), "estimated" label if needed. Picked place, rider id and driver view live in sessionStorage so a refresh or the dialer never restarts the flow.
- `/{station}/board`: QR code to `/{station}`, live waiting count, "Form groups" button, map with every group's route in a distinct colour, list of group cards.

## Words
Use: "shared auto", "your share", "legal metered fare (₹30 + ₹20/km, from 1 Sep 2026)", "estimated road distance". Never: "official", "RTO approved app", "guaranteed".

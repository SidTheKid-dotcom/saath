# Fairness: the rules, and why no one pays more than alone

Rules source: [CONTRACT.md](../CONTRACT.md), sections "Fare" and "Grouping". Code: [`src/lib/fare.ts`](../src/lib/fare.ts), [`src/lib/grouping.ts`](../src/lib/grouping.ts). Example output: [`docs/worked-example.ts`](worked-example.ts) (`npx tsx docs/worked-example.ts`).

## The rules in plain words

1. **Solo fare.** What a rider would pay riding alone: ₹30 up to 1.5 km, then ₹20 for each extra km, ×1.25 between 00:00 and 04:59 IST, rounded to the rupee. The distance is the road distance from the station to the rider's destination (`soloKm`).
2. **Seed.** Among riders not yet in a group, the one with the largest solo distance starts the next group. Tie: the smaller rider id.
3. **Same way.** Only riders whose bearing from the station is within 45° of the seed's bearing can join that group.
4. **Fill the auto.** While the auto has fewer than 3 riders, add the same-way rider who adds the least total route distance. The drop order is the best of all orderings (at most 3 drops, so at most 6 orderings).
5. **Accept only if everyone is fine.** A candidate joins only if, for every rider already in and the new one:
   - the distance they ride from the station to their drop, in this order, is at most min(1.25 × their solo distance, their solo distance + 1.5 km), and
   - their share is at most their solo fare.
   If no candidate passes, the group closes with the riders it has.
6. **Solo.** A group of one pays the solo fare.
7. **The split.** The auto's fare is `tariff` of the full route (station → drop 1 → drop 2 → drop 3). Each rider's share is proportional to their solo fare, rounded down to the rupee. The few rupees lost to rounding go to the rider with the largest solo fare (tie: first in the list), so shares add up to the fare exactly.

## Why no share can exceed the solo fare

The argument is a check built into the grouping, not a mathematical theorem about the tariff.

- Every group the algorithm outputs was priced by `price()` in `grouping.ts`. It splits the fare with `splitFare` and sets `ok` to true only when `shares[k] <= soloFares[k]` for every member `k` (and the ride-distance limit holds). This is evaluated *after* the rounding remainder has been assigned, so the largest-fare rider's extra rupees are included in the check.
- `bestOrder()` returns an ordering only if `plan.ok`; otherwise the candidate is skipped (rule 4 loop in `formGroups`). A seed that is alone is priced by the same function with one member, where the fare equals the solo fare.
- In the routed path (`formGroupsRouted`) the group is re-priced on real road legs by `recheck()`, which again calls `price()` and accepts a group (or a shorter prefix of it) only if `plan.ok`; otherwise the riders ride alone with their own solo fare.
- A group that would be unfair is therefore never output. When distances are wrong, the group is wrong in distance only: the shares still obey the rule against the solo fares the app computed.

Tests that exercise this:

- `expectInvariants` ([`grouping.test.ts:60`](../src/lib/grouping.test.ts)) asserts, for every group returned: each rider appears once, size ≤ 3, shares are integers that sum to `tariff(totalKm)`, shares equal `splitFare(...)`, `share <= soloFare`, ride ≤ min(1.25 × solo, solo + 1.5), and a lone rider's share equals their solo fare.
- It runs on: `(a) puts 3 riders toward Viman Nagar…`, `(b) keeps 2 opposite-direction riders solo`, `(c) satisfies every invariant for 7 seeded random riders around Ramwadi` (200 seeds, noisy asymmetric distances, noon and 01:00 IST), `refuses a candidate whose detour breaks rule 5`, and the `formGroupsRouted` tests including `(d) groups 250 seeded riders…`.
- `splitFare > always sums exactly to the total (seeded property test)` checks 5000 random splits for the exact-sum and flooring rules.

Limits of the argument:

- "Solo fare" is what the app computes from OSRM road distance (or the labelled estimate). A real meter reading may differ.
- In the routed path, solo distances of the second and third rider are scaled from the first leg's real/estimated ratio, not routed separately (see the comment above `recheck`). The share ≤ solo fare check is run on those scaled values.
- The saving relies on one meter fare for the whole route. Saath does not enforce that with a driver.

## Why the rules look like this

- **Within 45° of the seed:** keeps riders on one corridor so the drop order is mostly a line, not a detour. (`SAME_WAY_DEG`, `grouping.ts:12`.)
- **min(25%, 1.5 km) ride limit:** a short trip can't be stretched by a large percentage (the +1.5 km term caps it for long trips; the 25% term caps it for short ones). (`DETOUR_FACTOR`, `DETOUR_EXTRA_KM`.)
- **Remainder to the largest fare:** every share is rounded down, so the leftover has to go to someone; the rider with the longest trip has the largest solo fare, and the `ok` check verifies the result after the remainder is added, so it does not matter whether this choice could push someone over.
- **Brute-force drop order:** with at most 3 drops there are at most 6 orderings, so exact search is cheap.

## Scale path: 250 riders

`formGroups` needs a full distance matrix, which means a lot of road-distance lookups for a big room. `formGroupsRouted` (the function the "Form groups" endpoint calls) avoids that:

1. Screen all riders with `formGroups` on the haversine × 1.35 estimate (no network).
2. For each screened group of 2–3, make **one** OSRM route call (station → drops in order), four calls at a time. Re-price on real legs. Keep the group, keep a shorter prefix, or split everyone out if the rules fail on real distances.
3. Each solo rider gets one route call for their solo distance (also four at a time).
4. Any OSRM failure keeps the estimate and marks that group `estimated: true`.

The test `formGroupsRouted > (d) groups 250 seeded riders in under 2 s with mocked OSRM and keeps every invariant` uses a fake OSRM that answers after 1 ms, returns HTTP 503 on every 9th call and a network error on every 13th, and asserts: elapsed under 2000 ms, all invariants, at least one 3-rider group, some groups estimated and some not, at most 4 requests in flight, at most one request per rider, and only `/route/v1/driving/` URLs. This is a test with a mocked server; it is not a measurement of the real OSRM server.

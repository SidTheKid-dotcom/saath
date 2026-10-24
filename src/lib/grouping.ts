import {
  bearingDeg,
  haversineMatrix,
  routeKm,
  type DistanceMatrix,
  type DistanceOptions,
} from "./distance";
import { splitFare, tariff } from "./fare";
import type { Group, GroupMember, Point, RiderInput } from "./types";

const MAX_GROUP = 3;
const SAME_WAY_DEG = 45;
const DETOUR_FACTOR = 1.25;
const DETOUR_EXTRA_KM = 1.5;
/** Float slack for km sums; fares are integers and compared exactly. */
const KM_EPSILON = 1e-9;
const ROUTE_CONCURRENCY = 4;

export type RoutedOptions = DistanceOptions & {
  at?: Date;
};

/** One drop order, priced, with rule 5 evaluated. Arrays are in drop order. */
type Priced = {
  soloKm: number[];
  legKm: number[];
  rideKm: number[];
  totalKm: number;
  soloFares: number[];
  shares: number[];
  ok: boolean;
};

/**
 * CONTRACT.md grouping, pure and deterministic. matrix.km index 0 = station,
 * rider i = index i + 1 (order of `riders`).
 */
export function formGroups(
  station: Point,
  riders: RiderInput[],
  matrix: DistanceMatrix,
  at: Date = new Date(),
): Group[] {
  if (riders.length === 0) return [];
  assertInputs(riders, matrix);
  const km = matrix.km;
  const soloKm = riders.map((_, i) => km[0][i + 1]);
  const bearing = riders.map((r) => bearingDeg(station, r));
  const ungrouped = new Set(riders.keys());
  const groups: Group[] = [];

  while (ungrouped.size > 0) {
    // Rule 2: farthest ungrouped rider seeds the group (tie: smaller id).
    let seed = -1;
    for (const i of ungrouped) {
      if (
        seed < 0 ||
        soloKm[i] > soloKm[seed] ||
        (soloKm[i] === soloKm[seed] && riders[i].id < riders[seed].id)
      ) {
        seed = i;
      }
    }
    ungrouped.delete(seed);

    // Rule 3: same way = within 45° of the seed's bearing from the station.
    const candidates = [...ungrouped].filter(
      (i) => angleBetween(bearing[i], bearing[seed]) <= SAME_WAY_DEG,
    );

    // Rule 4: add the acceptable candidate that adds the least route km.
    let order = [seed];
    let plan = price([soloKm[seed]], [soloKm[seed]], at);
    while (order.length < MAX_GROUP) {
      let best: { rider: number; order: number[]; plan: Priced } | null = null;
      for (const c of candidates) {
        if (order.includes(c)) continue;
        const option = bestOrder([...order, c], km, soloKm, at);
        if (!option) continue;
        if (
          !best ||
          option.plan.totalKm < best.plan.totalKm ||
          (option.plan.totalKm === best.plan.totalKm && riders[c].id < riders[best.rider].id)
        ) {
          best = { rider: c, ...option };
        }
      }
      if (!best) break;
      order = best.order;
      plan = best.plan;
    }

    for (const i of order) ungrouped.delete(i);
    groups.push(toGroup(order.map((i) => riders[i]), plan, matrix.estimated));
  }
  return groups;
}

/**
 * Scale path for large rooms: screen with haversine × 1.35 (no network), then
 * one OSRM route call per group of 2-3 and per solo rider (4 at a time).
 * Groups that fail the rules on real km are split; any OSRM failure keeps the
 * estimate and marks that group estimated.
 */
export async function formGroupsRouted(
  station: Point,
  riders: RiderInput[],
  opts: RoutedOptions = {},
): Promise<Group[]> {
  const at = opts.at ?? new Date();
  const screened = formGroups(station, riders, haversineMatrix([station, ...riders]), at);
  const byId = new Map(riders.map((r) => [r.id, r]));
  const membersOf = (g: Group) =>
    g.riderIds.map((id) => byId.get(id)).filter((r): r is RiderInput => r !== undefined);

  const shared = screened.filter((g) => g.riderIds.length > 1);
  const rechecked = await mapLimit(shared, ROUTE_CONCURRENCY, (g) =>
    recheck(station, membersOf(g), g, opts, at),
  );

  // Keep the screening order; split-off riders ride solo right after their group.
  type Slot = { group: Group } | { solo: RiderInput };
  const slots: Slot[] = [];
  let next = 0;
  for (const g of screened) {
    if (g.riderIds.length === 1) {
      slots.push(...membersOf(g).map((solo) => ({ solo })));
    } else {
      const { kept, split } = rechecked[next++];
      if (kept) slots.push({ group: kept });
      slots.push(...split.map((solo) => ({ solo })));
    }
  }

  const solos = slots.flatMap((s) => ("solo" in s ? [s.solo] : []));
  const soloGroups = await mapLimit(solos, ROUTE_CONCURRENCY, async (r) => {
    const route = await routeKm([station, r], opts);
    const km = route.legKm[0];
    return toGroup([r], price([km], [km], at), route.estimated);
  });
  let s = 0;
  return slots.map((slot) => ("group" in slot ? slot.group : soloGroups[s++]));
}

/**
 * Re-prices a screened group on real road legs. Member 1's solo km is the real
 * first leg; later members' solo km is their screened solo km scaled by the
 * first leg's real/screened ratio (never above their real ride km). If the
 * group fails, its drop-order prefix (same real legs) is tried before
 * splitting everyone out.
 */
async function recheck(
  station: Point,
  members: RiderInput[],
  screened: Group,
  opts: DistanceOptions,
  at: Date,
): Promise<{ kept: Group | null; split: RiderInput[] }> {
  const route = await routeKm([station, ...members], opts);
  if (route.estimated) return { kept: screened, split: [] };

  const legs = route.legKm;
  const ratio = screened.legKm[0] > 0 ? legs[0] / screened.legKm[0] : 1;
  const ride = cumulative(legs);
  const soloKm = members.map((_, k) =>
    k === 0 ? legs[0] : Math.min(screened.perRider[k].soloKm * ratio, ride[k]),
  );
  for (let size = members.length; size >= 2; size--) {
    const plan = price(soloKm.slice(0, size), legs.slice(0, size), at);
    if (plan.ok) return { kept: toGroup(members.slice(0, size), plan, false), split: members.slice(size) };
  }
  return { kept: null, split: members };
}

/** Rule 4 drop order: cheapest permutation that passes rule 5, or null. */
function bestOrder(
  members: number[],
  km: number[][],
  soloKm: number[],
  at: Date,
): { order: number[]; plan: Priced } | null {
  let best: { order: number[]; plan: Priced } | null = null;
  for (const order of permutations(members)) {
    const legKm = order.map((r, k) => km[k === 0 ? 0 : order[k - 1] + 1][r + 1]);
    const plan = price(order.map((r) => soloKm[r]), legKm, at);
    if (plan.ok && (!best || plan.totalKm < best.plan.totalKm)) best = { order, plan };
  }
  return best;
}

/** Group fare = tariff(totalKm), split by solo fares; rule 5 checked for every member. */
function price(soloKm: number[], legKm: number[], at: Date): Priced {
  const rideKm = cumulative(legKm);
  const totalKm = rideKm[rideKm.length - 1];
  const soloFares = soloKm.map((s) => tariff(s, at));
  const shares = splitFare(tariff(totalKm, at), soloFares);
  const ok = soloKm.every(
    (s, k) =>
      rideKm[k] <= Math.min(s * DETOUR_FACTOR, s + DETOUR_EXTRA_KM) + KM_EPSILON &&
      shares[k] <= soloFares[k],
  );
  return { soloKm, legKm, rideKm, totalKm, soloFares, shares, ok };
}

function toGroup(members: RiderInput[], plan: Priced, estimated: boolean): Group {
  return {
    riderIds: members.map((r) => r.id),
    totalKm: plan.totalKm,
    legKm: plan.legKm,
    perRider: members.map((r, k): GroupMember => {
      const destText = (r as { destText?: unknown }).destText;
      return {
        id: r.id,
        soloKm: plan.soloKm[k],
        rideKm: plan.rideKm[k],
        soloFare: plan.soloFares[k],
        share: plan.shares[k],
        lat: r.lat,
        lon: r.lon,
        ...(typeof destText === "string" ? { destText } : {}),
      };
    }),
    estimated,
  };
}

function assertInputs(riders: RiderInput[], matrix: DistanceMatrix): void {
  const size = riders.length + 1;
  const square =
    matrix.km.length === size &&
    matrix.km.every(
      (row) => row.length === size && row.every((v) => Number.isFinite(v) && v >= 0),
    );
  if (!square) {
    throw new Error(`distance matrix must be ${size} × ${size} finite km (index 0 = station)`);
  }
  if (new Set(riders.map((r) => r.id)).size !== riders.length) {
    throw new Error("rider ids must be unique");
  }
}

function angleBetween(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function cumulative(values: number[]): number[] {
  let run = 0;
  return values.map((v) => (run += v));
}

function permutations(items: number[]): number[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((item, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]),
  );
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

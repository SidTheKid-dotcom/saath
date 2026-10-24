/** Legal metered fare (₹30 + ₹20/km, from 1 Sep 2026). Sources: HT 2 Sep 2026, FPJ 3 Sep 2026. */
const BASE_FARE = 30;
const BASE_KM = 1.5;
const PER_KM = 20;
const NIGHT_MULTIPLIER = 1.25;
/** Night rate applies from 00:00 up to (not including) 05:00 IST. */
const NIGHT_END_HOUR = 5;
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function tariff(km: number, at: Date): number {
  if (!Number.isFinite(km) || km < 0) throw new RangeError(`invalid km ${km}`);
  const day = km <= BASE_KM ? BASE_FARE : BASE_FARE + PER_KM * (km - BASE_KM);
  const fare = istHour(at) < NIGHT_END_HOUR ? day * NIGHT_MULTIPLIER : day;
  // Snap float noise first so e.g. 1.7 km at night (42.4999…) rounds as 42.5 does.
  return Math.round(Math.round(fare * 1e6) / 1e6);
}

/**
 * Shares proportional to soloFares, each floored to the rupee; the remainder
 * goes to the largest solo fare (tie: lowest index). Sums exactly to total.
 */
export function splitFare(total: number, soloFares: number[]): number[] {
  if (!Number.isInteger(total) || total < 0) throw new RangeError(`invalid total ${total}`);
  if (soloFares.length === 0) {
    if (total === 0) return [];
    throw new RangeError("no riders to split the fare between");
  }
  for (const f of soloFares) {
    if (!Number.isFinite(f) || f < 0) throw new RangeError(`invalid solo fare ${f}`);
  }
  const sum = soloFares.reduce((a, b) => a + b, 0);
  const shares = soloFares.map((f) =>
    sum > 0 ? Math.floor((total * f) / sum) : Math.floor(total / soloFares.length),
  );
  let largest = 0;
  for (let i = 1; i < soloFares.length; i++) {
    if (soloFares[i] > soloFares[largest]) largest = i;
  }
  shares[largest] += total - shares.reduce((a, b) => a + b, 0);
  return shares;
}

/** Hour of day (0-23) in IST, derived from the instant itself, never the machine timezone. */
function istHour(at: Date): number {
  const ms = at.getTime();
  if (Number.isNaN(ms)) throw new RangeError("invalid date");
  const istMs = (((ms + IST_OFFSET_MS) % DAY_MS) + DAY_MS) % DAY_MS;
  return Math.floor(istMs / HOUR_MS);
}

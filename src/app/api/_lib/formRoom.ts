import { getDb } from "../../../lib/db";
import { formingReady, settleAges } from "../../../lib/autoform";
import { formGroupsRouted } from "../../../lib/grouping";
import type { FormGroupsResponse, Station } from "../../../lib/types";

/**
 * Form every waiting rider in a station, once.
 *
 * Polls from riders, the board and drivers all call this. One in-flight call
 * per station is shared inside this server process. Across processes a row in
 * form_locks is taken with a single INSERT ... ON CONFLICT, so two polls cannot
 * both insert groups. The lock expires after 45s if a call dies mid-route.
 * The table is created here as well as in sql/003_form_lock.sql, so a room
 * still forms if migrate has not been run yet.
 */

export type FormAttempt = {
  formed: boolean;
  groups: FormGroupsResponse;
};

type Sql = ReturnType<typeof getDb>;

type WaitingRow = {
  id: string;
  lat: number;
  lon: number;
  dest_text: string;
  age_ms: number | string;
};

const inflight = new Map<string, Promise<FormAttempt>>();
let locksReady: Promise<void> | null = null;

const idle = (): FormAttempt => ({ formed: false, groups: [] });

export function resetFormRoomForTests(): void {
  inflight.clear();
  locksReady = null;
}

async function ensureLocks(sql: Sql): Promise<void> {
  if (!locksReady) {
    const pending = sql`CREATE TABLE IF NOT EXISTS form_locks (
      station text PRIMARY KEY,
      until timestamptz NOT NULL
    )`.then(() => undefined);
    locksReady = pending;
    try {
      await pending;
    } catch (error) {
      locksReady = null;
      throw error;
    }
  } else {
    await locksReady;
  }
}

async function loadWaiting(sql: Sql, slug: string): Promise<WaitingRow[]> {
  return (await sql`SELECT id, lat, lon, dest_text,
      EXTRACT(EPOCH FROM (now() - created_at)) * 1000 AS age_ms
    FROM riders
    WHERE station = ${slug} AND group_id IS NULL AND created_at > now() - interval '3 hours'
    ORDER BY created_at`) as WaitingRow[];
}

async function releaseLock(sql: Sql, slug: string): Promise<void> {
  await sql`UPDATE form_locks SET until = now() WHERE station = ${slug}`.catch(() => undefined);
}

async function runForm(station: Station): Promise<FormAttempt> {
  const sql = getDb();
  await ensureLocks(sql);
  const first = await loadWaiting(sql, station.slug);
  if (!formingReady(settleAges(first.map((row) => Number(row.age_ms))))) return idle();

  const locked = (await sql`INSERT INTO form_locks (station, until)
    VALUES (${station.slug}, now() + interval '45 seconds')
    ON CONFLICT (station) DO UPDATE
      SET until = now() + interval '45 seconds'
    WHERE form_locks.until < now()
    RETURNING station`) as Array<{ station: string }>;
  if (locked.length === 0) return idle();

  try {
    const rows = await loadWaiting(sql, station.slug);
    if (!formingReady(settleAges(rows.map((row) => Number(row.age_ms))))) return idle();

    const riders = rows.map((row) => ({ id: row.id, lat: row.lat, lon: row.lon }));
    const groups = await formGroupsRouted(station, riders);
    if (groups.length === 0) return idle();

    const byId = new Map(rows.map((row) => [row.id, row]));
    const stored: FormGroupsResponse = groups.map((group, index) => {
      const exit = station.exits[index % station.exits.length];
      const drops = group.riderIds.map((id) => {
        const row = byId.get(id);
        return { lat: row?.lat ?? station.lat, lon: row?.lon ?? station.lon };
      });
      const perRider = group.perRider.map((member) => {
        const row = byId.get(member.id);
        return row ? { ...member, lat: row.lat, lon: row.lon, destText: row.dest_text } : member;
      });
      return {
        ...group,
        perRider,
        meetAt: exit.label,
        route: [{ lat: exit.lat, lon: exit.lon }, ...drops],
      };
    });

    const queries = [];
    for (const group of stored) {
      const id = crypto.randomUUID();
      queries.push(
        sql`INSERT INTO groups (id, station, data) VALUES (${id}, ${station.slug}, ${JSON.stringify(group)}::jsonb)`,
      );
      queries.push(
        sql`UPDATE riders SET group_id = ${id}
          WHERE station = ${station.slug} AND group_id IS NULL AND id = ANY(${group.riderIds}::uuid[])`,
      );
    }
    await sql.transaction(queries);
    return { formed: true, groups: stored };
  } finally {
    await releaseLock(sql, station.slug);
  }
}

/** Share one attempt per station inside this process. Failures stay off the caller's response. */
export function tryFormRoom(station: Station): Promise<FormAttempt> {
  const existing = inflight.get(station.slug);
  if (existing) return existing;
  const run = runForm(station)
    .catch((error: unknown) => {
      console.error("auto-form failed", station.slug, error);
      return idle();
    })
    .finally(() => {
      inflight.delete(station.slug);
    });
  inflight.set(station.slug, run);
  return run;
}

import { NextResponse } from "next/server";
import { getDb, isUndefinedColumn } from "../../../../../../../lib/db";
import type { StoredGroup } from "../../../../../../../lib/types";
import { stationOr404 } from "../../../../../_lib/room";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A driver accepts a group. First accept wins: 200 with the group, 409 if taken, 404 if unknown.
 * Only the winning response carries the riders' phone numbers, so the driver who took the group
 * can call them; the public /groups list and the board never do.
 */
export async function POST(_request: Request, ctx: { params: Promise<{ station: string; id: string }> }) {
  const { station: slug, id } = await ctx.params;
  const { station, error } = stationOr404(slug);
  if (!station) return error;
  if (!UUID.test(id)) return NextResponse.json({ error: "Unknown group" }, { status: 404 });
  const sql = getDb();
  const won = (await sql`UPDATE groups SET data = data || jsonb_build_object('acceptedAt', now())
    WHERE id = ${id} AND station = ${station.slug} AND NOT (data ? 'acceptedAt')
    RETURNING id, station, created_at, data`) as Array<{
    id: string;
    station: string;
    created_at: string | Date;
    data: StoredGroup["data"];
  }>;
  if (won[0]) {
    const r = won[0];
    const phones = await groupPhones(sql, r.id);
    const data = { ...r.data, perRider: r.data.perRider.map((m) => (phones[m.id] ? { ...m, phone: phones[m.id] } : m)) };
    const body: StoredGroup = { id: r.id, station: r.station, createdAt: new Date(r.created_at).toISOString(), data };
    return NextResponse.json(body);
  }
  const exists = (await sql`SELECT id FROM groups WHERE id = ${id} AND station = ${station.slug}`) as unknown[];
  if (exists.length > 0) return NextResponse.json({ error: "Already taken" }, { status: 409 });
  return NextResponse.json({ error: "Unknown group" }, { status: 404 });
}

/** rider id -> phone for the members of one group. Empty if the phone column is not migrated yet. */
async function groupPhones(sql: ReturnType<typeof getDb>, groupId: string): Promise<Record<string, string>> {
  try {
    const rows = (await sql`SELECT id, phone FROM riders WHERE group_id = ${groupId} AND phone IS NOT NULL`) as Array<{
      id: string;
      phone: string;
    }>;
    return Object.fromEntries(rows.map((row) => [row.id, row.phone]));
  } catch (error) {
    if (isUndefinedColumn(error)) return {};
    throw error;
  }
}

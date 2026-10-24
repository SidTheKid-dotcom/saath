import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db";
import type { GetGroupsResponse } from "../../../../../lib/types";
import { tryFormRoom } from "../../../_lib/formRoom";
import { stationOr404 } from "../../../_lib/room";

export async function GET(_request: Request, ctx: { params: Promise<{ station: string }> }) {
  const { station: slug } = await ctx.params;
  const { station, error } = stationOr404(slug);
  if (!station) return error;
  await tryFormRoom(station);
  const sql = getDb();
  const rows = (await sql`SELECT id, station, created_at, data FROM groups
    WHERE station = ${station.slug} AND created_at > now() - interval '3 hours'
    ORDER BY created_at DESC LIMIT 50`) as Array<{
    id: string;
    station: string;
    created_at: string | Date;
    data: GetGroupsResponse[number]["data"];
  }>;
  const body: GetGroupsResponse = rows.map((r) => ({
    id: r.id,
    station: r.station,
    createdAt: new Date(r.created_at).toISOString(),
    data: r.data,
  }));
  return NextResponse.json(body);
}

import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db";
import { distanceMatrix } from "../../../../../lib/distance";
import { formGroups } from "../../../../../lib/grouping";
import type { FormGroupsResponse, Point } from "../../../../../lib/types";
import { checkBoardKey, stationOr404 } from "../../../_lib/room";

type Row = { id: string; lat: number; lon: number; dest_text: string };

export async function POST(request: Request, ctx: { params: Promise<{ station: string }> }) {
  const denied = checkBoardKey(request);
  if (denied) return denied;
  const { station: slug } = await ctx.params;
  const { station, error } = stationOr404(slug);
  if (!station) return error;
  const sql = getDb();

  const rows = (await sql`SELECT id, lat, lon, dest_text FROM riders
    WHERE station = ${station.slug} AND group_id IS NULL AND created_at > now() - interval '3 hours'
    ORDER BY created_at`) as Row[];
  if (rows.length === 0) return NextResponse.json([] satisfies FormGroupsResponse);

  const riders = rows.map((r) => ({ id: r.id, lat: r.lat, lon: r.lon }));
  const points: Point[] = [station, ...riders];
  const matrix = await distanceMatrix(points);
  const groups = formGroups(station, riders, matrix);
  const byId = new Map(rows.map((r) => [r.id, r]));

  const stored: FormGroupsResponse = groups.map((g, i) => {
    const exit = station.exits[i % station.exits.length];
    const drops = g.riderIds.map((id) => byId.get(id)!).map((r) => ({ lat: r.lat, lon: r.lon }));
    const perRider = g.perRider.map((m) => {
      const r = byId.get(m.id);
      return r ? { ...m, lat: r.lat, lon: r.lon, destText: r.dest_text } : m;
    });
    return { ...g, perRider, meetAt: exit.label, route: [{ lat: exit.lat, lon: exit.lon }, ...drops] };
  });

  const queries = [];
  for (const g of stored) {
    const id = crypto.randomUUID();
    queries.push(sql`INSERT INTO groups (id, station, data) VALUES (${id}, ${station.slug}, ${JSON.stringify(g)}::jsonb)`);
    queries.push(sql`UPDATE riders SET group_id = ${id} WHERE station = ${station.slug} AND id = ANY(${g.riderIds}::uuid[])`);
  }
  await sql.transaction(queries);
  return NextResponse.json(stored);
}

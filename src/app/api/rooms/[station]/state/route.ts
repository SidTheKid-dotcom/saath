import { NextResponse } from "next/server";
import { getDb, isUndefinedColumn } from "../../../../../lib/db";
import { bearingDeg } from "../../../../../lib/distance";
import type { Group } from "../../../../../lib/types";
import { tryFormRoom } from "../../../_lib/formRoom";
import { stationOr404 } from "../../../_lib/room";
import { shapeState, type RiderRow } from "./shape";

function angleDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export async function GET(request: Request, ctx: { params: Promise<{ station: string }> }) {
  const { station: slug } = await ctx.params;
  const { station, error } = stationOr404(slug);
  if (!station) return error;
  await tryFormRoom(station);
  const riderId = new URL(request.url).searchParams.get("rider") ?? "";
  const sql = getDb();

  const waiting = (await sql`SELECT id, name, dest_text, lat, lon FROM riders
    WHERE station = ${station.slug} AND group_id IS NULL AND created_at > now() - interval '3 hours'
    ORDER BY created_at`) as RiderRow[];

  let sameWay: RiderRow[] = [];
  let group: (Group & { meetAt: string }) | null = null;
  const phones: Record<string, string | null> = {};

  if (/^[0-9a-f-]{36}$/i.test(riderId)) {
    const meRows = (await sql`SELECT id, name, dest_text, lat, lon, group_id FROM riders
      WHERE id = ${riderId} AND station = ${station.slug}`) as Array<RiderRow & { group_id: string | null }>;
    const me = meRows[0];
    if (me) {
      const myBearing = bearingDeg(station, me);
      sameWay = waiting.filter((w) => w.id !== me.id && angleDiff(bearingDeg(station, w), myBearing) <= 45);
      if (me.group_id) {
        const rows = (await sql`SELECT data FROM groups WHERE id = ${me.group_id}`) as Array<{
          data: Group & { meetAt: string };
        }>;
        group = rows[0]?.data ?? null;
        try {
          const members = (await sql`SELECT id, phone FROM riders WHERE group_id = ${me.group_id}`) as Array<{
            id: string;
            phone: string | null;
          }>;
          for (const m of members) phones[m.id] = m.phone;
        } catch (err) {
          // Before sql/002 runs there is no phone column; the group still works without numbers.
          if (!isUndefinedColumn(err)) throw err;
        }
      }
    }
  }

  return NextResponse.json(shapeState({ riderId, waiting, sameWay, group, phones }));
}

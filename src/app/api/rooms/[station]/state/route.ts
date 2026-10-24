import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db";
import { bearingDeg } from "../../../../../lib/distance";
import type { Group, RoomRider, RoomState } from "../../../../../lib/types";
import { stationOr404 } from "../../../_lib/room";

type RiderRow = { id: string; name: string | null; dest_text: string; lat: number; lon: number };

function toRider(r: RiderRow): RoomRider {
  return { id: r.id, name: r.name, destText: r.dest_text, lat: r.lat, lon: r.lon };
}

function angleDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export async function GET(request: Request, ctx: { params: Promise<{ station: string }> }) {
  const { station: slug } = await ctx.params;
  const { station, error } = stationOr404(slug);
  if (!station) return error;
  const riderId = new URL(request.url).searchParams.get("rider") ?? "";
  const sql = getDb();

  const waitingRows = (await sql`SELECT id, name, dest_text, lat, lon FROM riders
    WHERE station = ${station.slug} AND group_id IS NULL AND created_at > now() - interval '3 hours'
    ORDER BY created_at`) as RiderRow[];
  const waiting = waitingRows.map(toRider);

  let sameWay: RoomRider[] = [];
  let group: RoomState["group"] = null;

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
      }
    }
  }

  const body: RoomState = { waiting, sameWay, group, estimated: group?.estimated ?? false };
  return NextResponse.json(body);
}

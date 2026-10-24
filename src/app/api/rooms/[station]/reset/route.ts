import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db";
import type { ResetRoomResponse } from "../../../../../lib/types";
import { checkBoardKey, stationOr404 } from "../../../_lib/room";

export async function POST(request: Request, ctx: { params: Promise<{ station: string }> }) {
  const denied = checkBoardKey(request);
  if (denied) return denied;
  const { station: slug } = await ctx.params;
  const { station, error } = stationOr404(slug);
  if (!station) return error;
  const sql = getDb();
  // Push riders and groups out of the 3-hour room window. Nothing is deleted.
  await sql.transaction([
    sql`UPDATE riders SET created_at = now() - interval '1 day' WHERE station = ${station.slug}`,
    sql`UPDATE groups SET created_at = now() - interval '1 day' WHERE station = ${station.slug}`,
  ]);
  return NextResponse.json({ ok: true } satisfies ResetRoomResponse);
}

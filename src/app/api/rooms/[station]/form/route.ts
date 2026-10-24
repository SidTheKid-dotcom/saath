import { NextResponse } from "next/server";
import type { FormGroupsResponse } from "../../../../../lib/types";
import { tryFormRoom } from "../../../_lib/formRoom";
import { stationOr404 } from "../../../_lib/room";

/** Form waiting riders if the room has settled. No key. Returns the groups this call stored. */
export async function POST(_request: Request, ctx: { params: Promise<{ station: string }> }) {
  const { station: slug } = await ctx.params;
  const { station, error } = stationOr404(slug);
  if (!station) return error;
  const { groups } = await tryFormRoom(station);
  return NextResponse.json(groups satisfies FormGroupsResponse);
}

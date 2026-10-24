import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, isUndefinedColumn } from "../../../../../lib/db";
import { normalizePhone } from "../../../../../lib/phone";
import { tryFormRoom } from "../../../_lib/formRoom";
import { inBbox, stationOr404 } from "../../../_lib/room";

const schema = z.object({
  name: z.string().trim().max(60).optional(),
  destText: z.string().trim().min(1).max(200),
  lat: z.number().finite(),
  lon: z.number().finite(),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((value, ctx) => {
      if (!value) return undefined;
      const phone = normalizePhone(value);
      if (!phone) {
        ctx.addIssue({ code: "custom", message: "Invalid phone" });
        return z.NEVER;
      }
      return phone;
    }),
});

export async function POST(request: Request, ctx: { params: Promise<{ station: string }> }) {
  const { station: slug } = await ctx.params;
  const { station, error } = stationOr404(slug);
  if (!station) return error;

  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const { name, destText, lat, lon, phone } = body.data;
  if (!inBbox(lat, lon)) return NextResponse.json({ error: "Point outside Pune area" }, { status: 400 });

  const riderId = crypto.randomUUID();
  const sql = getDb();
  try {
    await sql`INSERT INTO riders (id, station, name, dest_text, lat, lon, phone)
              VALUES (${riderId}, ${station.slug}, ${name || null}, ${destText}, ${lat}, ${lon}, ${phone ?? null})`;
  } catch (err) {
    // Before sql/002 runs there is no phone column: join without it rather than fail.
    if (!isUndefinedColumn(err)) throw err;
    await sql`INSERT INTO riders (id, station, name, dest_text, lat, lon)
              VALUES (${riderId}, ${station.slug}, ${name || null}, ${destText}, ${lat}, ${lon})`;
  }
  await tryFormRoom(station);
  return NextResponse.json({ riderId });
}

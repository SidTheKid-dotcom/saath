import type { Group, RoomRider, RoomState } from "../../../../../lib/types";

export type RiderRow = { id: string; name: string | null; dest_text: string; lat: number; lon: number; phone?: string | null };

/** Waiting / sameWay entries never carry a phone, whatever the row holds. */
export function toRider(r: RiderRow): RoomRider {
  return { id: r.id, name: r.name, destText: r.dest_text, lat: r.lat, lon: r.lon };
}

/**
 * Shapes /state output. Privacy rule: phones are only attached to members of the rider's own
 * formed group, and only when the asking rider is in that group.
 */
export function shapeState(input: {
  riderId: string;
  waiting: RiderRow[];
  sameWay: RiderRow[];
  group: (Group & { meetAt: string }) | null;
  phones: Record<string, string | null | undefined>;
}): RoomState {
  const { riderId, group, phones } = input;
  let shaped: RoomState["group"] = null;
  if (group) {
    const inGroup = group.riderIds.includes(riderId);
    shaped = {
      ...group,
      perRider: (group.perRider ?? []).map((m) => {
        const { phone: _drop, ...rest } = m;
        void _drop;
        const phone = inGroup && group.riderIds.includes(m.id) ? phones[m.id] : null;
        return phone ? { ...rest, phone } : rest;
      }),
    };
  }
  return {
    waiting: input.waiting.map(toRider),
    sameWay: input.sameWay.map(toRider),
    group: shaped,
    estimated: shaped?.estimated ?? false,
  };
}

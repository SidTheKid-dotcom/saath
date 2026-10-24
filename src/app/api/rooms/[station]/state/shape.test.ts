import { describe, expect, it } from "vitest";
import type { Group } from "../../../../../lib/types";
import { shapeState, type RiderRow } from "./shape";

const row = (id: string): RiderRow => ({ id, name: id, dest_text: `${id} place`, lat: 18.56, lon: 73.91, phone: "+919800000000" });

const group: Group & { meetAt: string } = {
  riderIds: ["a", "b"],
  totalKm: 3,
  legKm: [2, 1],
  perRider: [
    { id: "a", soloKm: 2, rideKm: 2, soloFare: 40, share: 30 },
    // A phone that somehow got into stored data must not pass through on its own.
    { id: "b", soloKm: 3, rideKm: 3, soloFare: 60, share: 40, phone: "+919811111111" },
  ],
  estimated: false,
  meetAt: "Gate 2",
};

const phones = { a: "+919876543210", b: "+919822012345", c: "+919890055555" };

describe("shapeState privacy", () => {
  it("never puts phones in waiting or sameWay", () => {
    const out = shapeState({ riderId: "a", waiting: [row("c"), row("d")], sameWay: [row("c")], group: null, phones });
    expect(JSON.stringify(out)).not.toContain("+91");
    expect(out.waiting.map((r) => r.id)).toEqual(["c", "d"]);
  });

  it("gives group members each other's phones", () => {
    const out = shapeState({ riderId: "a", waiting: [], sameWay: [], group, phones });
    expect(out.group?.perRider.map((m) => m.phone)).toEqual([phones.a, phones.b]);
  });

  it("drops phones when the asking rider is not in the group", () => {
    const out = shapeState({ riderId: "c", waiting: [row("c")], sameWay: [], group, phones });
    expect(JSON.stringify(out)).not.toContain("+91");
  });

  it("only uses phones of riders in the group", () => {
    const out = shapeState({ riderId: "a", waiting: [], sameWay: [], group, phones: { a: phones.a, c: phones.c } });
    expect(out.group?.perRider.map((m) => m.phone)).toEqual([phones.a, undefined]);
    expect(JSON.stringify(out)).not.toContain(phones.c);
  });
});

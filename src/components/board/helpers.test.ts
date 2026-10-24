import { describe, expect, it } from "vitest";
import {
  GROUP_COLOURS,
  boundsAreFlat,
  boundsOf,
  colourForGroup,
  dropPins,
  groupFareTotal,
  isBoardKeyRejected,
  pointsForFit,
  riderTitle,
  routeLine,
  shouldLoadDemoGroups,
  textOn,
} from "./helpers";

const member = {
  soloKm: 1,
  rideKm: 1,
  soloFare: 48,
  share: 31,
};

describe("board helpers", () => {
  it("cycles a fixed palette of six colours", () => {
    expect(GROUP_COLOURS).toHaveLength(6);
    expect(new Set(GROUP_COLOURS).size).toBe(6);
    expect(colourForGroup(0)).toBe(GROUP_COLOURS[0]);
    expect(colourForGroup(6)).toBe(GROUP_COLOURS[0]);
    expect(colourForGroup(7)).toBe(GROUP_COLOURS[1]);
    expect(colourForGroup(-1)).toBe(GROUP_COLOURS[5]);
  });

  it("picks ink that stays readable on each group colour", () => {
    expect(textOn("#0072B2")).toBe("#ffffff");
    expect(textOn("#E69F00")).toBe("#111111");
    expect(textOn("blue")).toBe("#ffffff");
  });

  it("sums shares into the group total", () => {
    expect(groupFareTotal([31, 41])).toBe(72);
    expect(groupFareTotal([])).toBe(0);
  });

  it("bounds every point and notices a single point", () => {
    expect(
      boundsOf([
        { lat: 1, lon: 2 },
        { lat: -3, lon: -4 },
      ]),
    ).toEqual({ west: -4, south: -3, east: 2, north: 1 });
    const single = boundsOf([{ lat: 18.5, lon: 73.8 }]);
    expect(single).toEqual({ west: 73.8, south: 18.5, east: 73.8, north: 18.5 });
    expect(single && boundsAreFlat(single)).toBe(true);
    expect(boundsOf([])).toBeNull();
  });

  it("uses the stored route, else joins the station to each drop pin", () => {
    const station = { lat: 0, lon: 0 };
    const pins = [
      { id: "a", lat: 1, lon: 2, number: 1 },
      { id: "b", lat: 3, lon: 4, number: 2 },
    ];
    const line = [
      { lat: 1, lon: 2 },
      { lat: 3, lon: 4 },
    ];
    expect(routeLine(line, station, pins)).toBe(line);
    expect(routeLine(undefined, station, pins)).toEqual([
      { lat: 0, lon: 0 },
      { lat: 1, lon: 2 },
      { lat: 3, lon: 4 },
    ]);
    expect(routeLine([{ lat: 1, lon: 2 }], station, [])).toBeNull();
    expect(routeLine(undefined, station, [])).toBeNull();
  });

  it("numbers drop pins in rider order and skips members without a point", () => {
    const pins = dropPins(
      ["asha", "rohan", "meera"],
      [
        { ...member, id: "rohan", lat: 2, lon: 4 },
        { ...member, id: "asha", lat: 1, lon: 3 },
        { ...member, id: "meera", share: 10 },
        { ...member, id: "ghost", lat: Number.NaN, lon: 1 },
      ],
    );
    expect(pins).toEqual([
      { id: "asha", lat: 1, lon: 3, number: 1 },
      { id: "rohan", lat: 2, lon: 4, number: 2 },
    ]);
  });

  it("falls back to a known point for a member without its own", () => {
    const known = new Map([["meera", { lat: 5, lon: 6 }]]);
    expect(dropPins(["meera"], [{ ...member, id: "meera" }], known)).toEqual([
      { id: "meera", lat: 5, lon: 6, number: 1 },
    ]);
    expect(dropPins(["meera"], [{ ...member, id: "meera" }])).toEqual([]);
  });

  it("fits the station, the drawn routes, and the drop pins", () => {
    const points = pointsForFit(
      { lat: 18.55, lon: 73.9 },
      [[{ lat: 18.56, lon: 73.91 }, { lat: 18.57, lon: 73.92 }]],
      [{ id: "asha", lat: 18.58, lon: 73.93, number: 1 }],
    );
    expect(points).toEqual([
      { lat: 18.55, lon: 73.9 },
      { lat: 18.56, lon: 73.91 },
      { lat: 18.57, lon: 73.92 },
      { lat: 18.58, lon: 73.93 },
    ]);
  });

  it("uses a short name and falls back for ids", () => {
    expect(riderTitle("asha", "Rider 1")).toBe("Asha");
    expect(riderTitle("  Meera ", "Rider 1")).toBe("Meera");
    expect(riderTitle("11111111-2222-4333-8444-555555555555", "Rider 2")).toBe("Rider 2");
    expect(riderTitle("", "Rider 3")).toBe("Rider 3");
  });

  it("treats 401 and 403 as a rejected board key", () => {
    expect(isBoardKeyRejected(new Error("Request failed (401)"))).toBe(true);
    expect(isBoardKeyRejected(new Error("Request failed (403)"))).toBe(true);
    expect(isBoardKeyRejected(new Error("Request failed (500)"))).toBe(false);
    expect(isBoardKeyRejected("no")).toBe(false);
  });

  it("loads demo groups only in mock mode", () => {
    expect(shouldLoadDemoGroups("groups", "1")).toBe(true);
    expect(shouldLoadDemoGroups("groups", "0")).toBe(false);
    expect(shouldLoadDemoGroups("groups", undefined)).toBe(false);
    expect(shouldLoadDemoGroups("other", "1")).toBe(false);
    expect(shouldLoadDemoGroups(null, "1")).toBe(false);
  });
});

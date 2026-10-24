import { describe, expect, it } from "vitest";
import type { Station } from "../../lib/types";
import { metroMatches, nearbyMetros } from "./metro";

const s = (slug: string, name: string): Station => ({ slug, name, lat: 18.5, lon: 73.8, exits: [] });
const list = [s("ramwadi", "Ramwadi"), s("vanaz", "Vanaz"), s("civil-court", "Civil Court"), s("ruby-hall", "Ruby Hall Clinic")];

describe("metroMatches", () => {
  it("matches word starts and leaves out the start station", () => {
    expect(metroMatches("va", "ramwadi", list).map((x) => x.slug)).toEqual(["vanaz"]);
    expect(metroMatches("ram", "ramwadi", list)).toEqual([]);
    expect(metroMatches("court", "ramwadi", list).map((x) => x.slug)).toEqual(["civil-court"]);
  });
  it("needs two characters", () => {
    expect(metroMatches("r", "vanaz", list)).toEqual([]);
  });
  it("matches inside names from three characters", () => {
    expect(metroMatches("all", "vanaz", list).map((x) => x.slug)).toEqual(["ruby-hall"]);
  });

  it("offers the nearest other stations first", () => {
    const placed: Station[] = [
      { slug: "ramwadi", name: "Ramwadi", lat: 18.557, lon: 73.909, exits: [] },
      { slug: "kalyani", name: "Kalyani Nagar", lat: 18.548, lon: 73.902, exits: [] },
      { slug: "vanaz", name: "Vanaz", lat: 18.507, lon: 73.805, exits: [] },
      { slug: "pcmc", name: "PCMC", lat: 18.629, lon: 73.803, exits: [] },
    ];
    expect(nearbyMetros("ramwadi", placed, 2).map((station) => station.slug)).toEqual(["kalyani", "vanaz"]);
    expect(nearbyMetros("missing", placed)).toEqual([]);
  });
});

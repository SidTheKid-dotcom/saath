import { describe, expect, it } from "vitest";
import type { Station } from "../../lib/types";
import { metroMatches } from "./metro";

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
});

import { describe, expect, it } from "vitest";
import { matchesQuery, nearestStation } from "./nearest";

describe("nearestStation", () => {
  it("picks the station you are standing at", () => {
    expect(nearestStation({ lat: 18.55703, lon: 73.90856 }).station.slug).toBe("ramwadi");
    expect(nearestStation({ lat: 18.5072, lon: 73.8052 }).station.slug).toBe("vanaz");
  });

  it("reports km from the station", () => {
    const { km } = nearestStation({ lat: 18.5, lon: 73.8574 });
    expect(km).toBeLessThan(0.3);
  });
});

describe("matchesQuery", () => {
  it("matches names and aliases, ignoring case", () => {
    expect(matchesQuery("Ramwadi", [], "ram")).toBe(true);
    expect(matchesQuery("Paud Phata", ["Ideal Colony"], "ideal")).toBe(true);
    expect(matchesQuery("Vanaz", [], "swar")).toBe(false);
    expect(matchesQuery("Vanaz", [], "  ")).toBe(true);
  });
});

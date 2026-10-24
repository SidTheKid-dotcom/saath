import { describe, expect, it } from "vitest";
import { getStation } from "./stations";

describe("getStation", () => {
  it("returns the contracted station points", () => {
    const ramwadi = getStation("ramwadi");
    expect(ramwadi).toMatchObject({
      slug: "ramwadi",
      name: "Ramwadi",
      lat: 18.55703,
      lon: 73.90856,
    });
    expect(ramwadi?.exits).toEqual([
      { label: "Gate 2", lat: 18.55761, lon: 73.90907 },
      { label: "Gate 3", lat: 18.55727, lon: 73.90928 },
    ]);

    const vanaz = getStation("vanaz");
    expect(vanaz).toMatchObject({
      slug: "vanaz",
      name: "Vanaz",
      lat: 18.50719,
      lon: 73.80519,
    });
    expect(vanaz?.exits).toEqual([
      { label: "Station exit", lat: 18.50719, lon: 73.80519 },
    ]);
  });

  it("returns null for an unknown slug", () => {
    expect(getStation("kothrud")).toBeNull();
    expect(getStation("")).toBeNull();
  });
});

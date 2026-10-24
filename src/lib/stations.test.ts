import { describe, expect, it } from "vitest";
import { getStation, lines, linesOf, stations } from "./stations";

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

  it("lists every operational station once, inside the Pune bbox", () => {
    expect(stations).toHaveLength(29);
    const slugs = stations.map((station) => station.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const station of stations) {
      expect(station.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(station.lat).toBeGreaterThanOrEqual(18.4);
      expect(station.lat).toBeLessThanOrEqual(18.7);
      expect(station.lon).toBeGreaterThanOrEqual(73.7);
      expect(station.lon).toBeLessThanOrEqual(74.05);
      expect(station.exits.length).toBeGreaterThan(0);
      expect(getStation(station.slug)).toBe(station);
    }
  });

  it("puts every station on a line and every line slug on a station", () => {
    for (const station of stations) {
      expect(linesOf(station.slug).length).toBeGreaterThan(0);
    }
    for (const line of Object.values(lines)) {
      for (const slug of line.slugs) expect(getStation(slug)).not.toBeNull();
    }
    expect(lines.purple.slugs).toHaveLength(14);
    expect(lines.aqua.slugs).toHaveLength(16);
    expect(linesOf("district-court")).toEqual(["purple", "aqua"]);
  });
});

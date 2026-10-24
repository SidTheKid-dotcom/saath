import type { Point } from "./types";

export type DistanceMatrix = {
  km: number[][];
  estimated: boolean;
};

export async function distanceMatrix(points: Point[]): Promise<DistanceMatrix> {
  void points;
  throw new Error("not implemented: T2");
}

export function haversineKm(a: Point, b: Point): number {
  void a;
  void b;
  throw new Error("not implemented: T2");
}

export function bearingDeg(a: Point, b: Point): number {
  void a;
  void b;
  throw new Error("not implemented: T2");
}

/** Same bbox the API enforces (CONTRACT.md): lon 73.70-74.05, lat 18.40-18.70. */
export const BBOX = { minLon: 73.7, maxLon: 74.05, minLat: 18.4, maxLat: 18.7 };

export function inBbox(lat: number, lon: number): boolean {
  return lat >= BBOX.minLat && lat <= BBOX.maxLat && lon >= BBOX.minLon && lon <= BBOX.maxLon;
}

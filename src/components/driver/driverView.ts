import type { StoredGroup } from "../../lib/types";

export type DriverStop = { id: string; place: string | null; share: number };

/** Stops in drop order (group.riderIds). No phones: drivers never see them. */
export function driverStops(group: StoredGroup["data"]): DriverStop[] {
  return group.riderIds.map((id) => {
    const member = group.perRider.find((m) => m.id === id);
    return { id, place: member?.destText?.trim() || null, share: member?.share ?? 0 };
  });
}

/** Legal metered fare for the whole auto: the sum of every share. */
export function groupTotal(group: StoredGroup["data"]): number {
  return group.perRider.reduce((sum, m) => sum + m.share, 0);
}

export function newestFirst(groups: StoredGroup[]): StoredGroup[] {
  return [...groups].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

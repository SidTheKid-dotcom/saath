import { copy, t, type Lang } from "../../content/copy";
import type { Group } from "../../lib/types";

export type Stop = {
  id: string;
  isYou: boolean;
  /** "You" or "Rider N" (others are numbered in drop order, skipping you). */
  label: string;
  /** The rider's own words for the drop, when the server sent them. */
  place: string | null;
  share: number;
  /** Only set for members of the rider's own group (privacy rule in /state). */
  phone: string | null;
};

/** Stops in drop order, straight from group.riderIds. */
export function dropStops(group: Group, riderId: string | null, lang: Lang): Stop[] {
  let others = 0;
  return group.riderIds.map((id) => {
    const member = group.perRider.find((m) => m.id === id);
    const isYou = id === riderId;
    if (!isYou) others += 1;
    return {
      id,
      isYou,
      label: isYou ? t(copy.rider.you, lang) : copy.rider.rider[lang](others),
      place: member?.destText?.trim() || null,
      share: member?.share ?? 0,
      phone: member?.phone ?? null,
    };
  });
}

/** Y in "You pay X of Y": the legal metered fare is the sum of every share. */
export function totalFare(group: Group): number {
  return group.perRider.reduce((sum, member) => sum + member.share, 0);
}

"use client";

import { useStored, writeStored } from "./storage";

export type Role = "rider" | "driver";

export const ROLE_KEY = "saath-role";

export function parseRole(raw: string | null): Role | null {
  return raw === "rider" || raw === "driver" ? raw : null;
}

/** The remembered rider/driver choice; null until the user picks one. */
export function useRole(): Role | null {
  return parseRole(useStored("local", ROLE_KEY));
}

export function setRole(role: Role | null) {
  writeStored("local", ROLE_KEY, role);
}

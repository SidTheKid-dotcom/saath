import { getState } from "@/lib/api";
import type { RoomState } from "@/lib/types";

/**
 * Waiting count for the projector. An empty rider id asks for state without a rider.
 * When getState makes that argument optional, this return is the only line to change.
 */
export function getBoardState(station: string): Promise<RoomState> {
  return getState(station, "");
}

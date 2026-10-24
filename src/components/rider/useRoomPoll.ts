"use client";

import { useEffect, useState } from "react";
import { getState } from "../../lib/api";
import type { RoomState } from "../../lib/types";

const POLL_MS = 3000;

/** Polls the room every 3 s until a group arrives. A failed fetch flags `failing` and polling goes on. */
export function useRoomPoll(station: string, riderId: string | null) {
  const [state, setState] = useState<RoomState | null>(null);
  const [failing, setFailing] = useState(false);
  const done = state?.group != null;

  useEffect(() => {
    if (!riderId || done) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      try {
        const next = await getState(station, riderId);
        if (cancelled) return;
        setState(next);
        setFailing(false);
        if (next.group) return;
      } catch {
        if (cancelled) return;
        setFailing(true);
      }
      timer = setTimeout(tick, POLL_MS);
    };
    void tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [station, riderId, done]);

  return { state, failing };
}

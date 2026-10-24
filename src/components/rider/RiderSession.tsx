"use client";

import { useState } from "react";
import type { Lang } from "../../content/copy";
import type { Station } from "../../lib/types";
import { DriverCard } from "./DriverCard";
import { GroupCard } from "./GroupCard";
import { useRoomPoll } from "./useRoomPoll";
import { WaitingStep } from "./WaitingStep";

type Props = {
  station: Station;
  riderId: string;
  lang: Lang;
  /** Open on the driver card (dev ?demo=driver). */
  startOnDriver: boolean;
  onStartOver: () => void;
};

/** Waiting -> group card -> driver card for a joined rider. Mounted per riderId. */
export function RiderSession({ station, riderId, lang, startOnDriver, onStartOver }: Props) {
  const { state, failing } = useRoomPoll(station.slug, riderId);
  const [showDriver, setShowDriver] = useState(startOnDriver);

  if (state?.group) {
    if (showDriver) {
      return (
        <DriverCard
          group={state.group}
          station={station.name}
          riderId={riderId}
          lang="mr"
          onBack={() => setShowDriver(false)}
        />
      );
    }
    return (
      <GroupCard
        lang={lang}
        group={state.group}
        riderId={riderId}
        estimated={state.estimated}
        onShowDriver={() => setShowDriver(true)}
      />
    );
  }

  return <WaitingStep lang={lang} state={state} failing={failing} onStartOver={onStartOver} />;
}

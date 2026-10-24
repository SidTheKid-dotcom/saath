"use client";

import type { Lang } from "../../content/copy";
import type { Station } from "../../lib/types";
import { DriverCard } from "./DriverCard";
import { GroupCard } from "./GroupCard";
import { driverKey, useStored, writeStored } from "./storage";
import { useRoomPoll } from "./useRoomPoll";
import { WaitingStep } from "./WaitingStep";

type Props = {
  station: Station;
  riderId: string;
  lang: Lang;
  onStartOver: () => void;
};

/** Waiting -> group card -> driver card for a joined rider. Mounted per riderId. */
export function RiderSession({ station, riderId, lang, onStartOver }: Props) {
  const { state, failing } = useRoomPoll(station.slug, riderId);
  // Kept in sessionStorage so coming back from the dialer lands on the same card.
  const showDriver = useStored("session", driverKey(station.slug)) === riderId;
  const setShowDriver = (on: boolean) => {
    writeStored("session", driverKey(station.slug), on ? riderId : null);
  };
  const startOver = () => {
    setShowDriver(false);
    onStartOver();
  };

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
        onStartOver={startOver}
      />
    );
  }

  return (
    <WaitingStep
      lang={lang}
      state={state}
      gate={station.exits[0]?.label ?? station.name}
      failing={failing}
      onStartOver={startOver}
    />
  );
}

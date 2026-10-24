"use client";

import { useState } from "react";
import { copy, t, type Lang } from "../../content/copy";
import { joinRoom } from "../../lib/api";
import type { GeocodeResult, Point, Station } from "../../lib/types";
import { inBbox } from "./geo";
import { PinMap } from "./PinMap";
import styles from "./Rider.module.css";

type Props = {
  station: Station;
  lang: Lang;
  name: string;
  dest: GeocodeResult;
  onBack: () => void;
  onJoined: (riderId: string) => void;
};

export function ConfirmStep({ station, lang, name, dest, onBack, onJoined }: Props) {
  const [pin, setPin] = useState<Point>({ lat: dest.lat, lon: dest.lon });
  const [outside, setOutside] = useState(!inBbox(dest.lat, dest.lon));
  const [ready, setReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [joining, setJoining] = useState(false);
  const [failed, setFailed] = useState(false);

  const join = async () => {
    setJoining(true);
    setFailed(false);
    try {
      const trimmed = name.trim();
      const { riderId } = await joinRoom(station.slug, {
        ...(trimmed ? { name: trimmed } : {}),
        destText: dest.label,
        lat: pin.lat,
        lon: pin.lon,
      });
      onJoined(riderId);
    } catch {
      setFailed(true);
      setJoining(false);
    }
  };

  return (
    <section className={`${styles.step} ${styles.confirm}`}>
      <h1 className={styles.title}>{t(copy.rider.confirmTitle, lang)}</h1>
      <p className={styles.destLine}>{dest.label}</p>
      <p className={styles.sub}>{t(copy.rider.confirmHint, lang)}</p>

      <PinMap
        lang={lang}
        ready={ready}
        failed={mapFailed}
        station={station}
        pin={{ lat: dest.lat, lon: dest.lon }}
        onMove={(point) => {
          setPin(point);
          setOutside(false);
        }}
        onOutside={() => setOutside(true)}
        onReady={() => setReady(true)}
        onFail={() => setMapFailed(true)}
      />

      <div className={styles.actions}>
        {outside && (
          <p className={styles.errorText} role="alert">
            {t(copy.rider.outsideArea, lang)}
          </p>
        )}
        {failed && (
          <p className={styles.errorText} role="alert">
            {t(copy.errors.generic, lang)}
          </p>
        )}
        <button type="button" className={styles.primary} disabled={joining || outside} onClick={join}>
          {joining ? t(copy.rider.joining, lang) : t(copy.rider.confirmButton, lang)}
        </button>
        <button type="button" className={styles.secondary} onClick={onBack} disabled={joining}>
          {t(copy.rider.changeDest, lang)}
        </button>
      </div>
    </section>
  );
}

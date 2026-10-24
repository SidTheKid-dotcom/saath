"use client";

import { copy, t, type Lang } from "../../content/copy";
import type { Group } from "../../lib/types";
import { CallButton } from "./CallButton";
import { dropStops, totalFare } from "./groupView";
import styles from "./DriverCard.module.css";

type Props = {
  group: Group & { meetAt: string };
  /** Station display name, e.g. "Ramwadi". */
  station: string;
  riderId: string | null;
  /** Page language: the whole card renders in it. */
  lang: Lang;
  /** Switches the page language (the same toggle as the header). */
  onLang: (lang: Lang) => void;
  onBack: () => void;
};

const other = (lang: Lang): Lang => (lang === "mr" ? "en" : "mr");

/** Full-screen card for the auto driver, in the page language; its toggle switches the whole page. */
export function DriverCard({ group, station, riderId, lang, onLang, onBack }: Props) {
  const first = lang;
  const stops = dropStops(group, riderId, first);
  const total = totalFare(group);

  return (
    <div className={styles.card}>
      <div className={styles.bar}>
        <button type="button" className={styles.barBtn} onClick={onBack}>
          ← {t(copy.driver.back, first)}
        </button>
        <button type="button" className={styles.barBtn} onClick={() => onLang(other(first))}>
          {t(copy.switchLang, first)}
        </button>
      </div>

      <h1 className={styles.title}>
        <span className={styles.big}>{t(copy.driver.title, first)}</span>
      </h1>
      <p className={styles.line}>{copy.rider.stationLine[first](station)}</p>

      <div className={styles.totalBox}>
        <span className={styles.totalBig}>{copy.driver.total[first](total)}</span>
        <span className={styles.km}>
          {copy.driver.distance[first](group.totalKm)}
          {group.estimated ? ` · ${t(copy.estimated, first)}` : ""}
        </span>
      </div>

      <div className={styles.meet}>
        <span className={styles.big}>{copy.rider.meetAt[first](group.meetAt)}</span>
      </div>

      <h2 className={styles.h2}>
        {t(copy.driver.stops, first)}
      </h2>
      <ol className={styles.stops}>
        {stops.map((stop, index) => (
          <li key={stop.id} className={styles.stop}>
            <span className={styles.stopNum}>{index + 1}</span>
            <span className={styles.stopBody}>
              <span className={styles.stopPlace}>{stop.place ?? stop.label}</span>
              <span className={styles.stopShare}>
                {copy.driver.share[first](stop.share)}
              </span>
              {!stop.isYou && stop.phone && (
                <CallButton phone={stop.phone} who={stop.label} lang={first} className={styles.callBtn} />
              )}
            </span>
          </li>
        ))}
      </ol>

      <p className={styles.meter}>
        <span className={styles.big}>{t(copy.driver.runMeter, first)}</span>
      </p>
    </div>
  );
}

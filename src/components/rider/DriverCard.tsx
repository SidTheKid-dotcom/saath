"use client";

import { useState } from "react";
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
  /** Language shown first and large. The other language sits under it. */
  lang: Lang;
  onBack: () => void;
};

const other = (lang: Lang): Lang => (lang === "mr" ? "en" : "mr");

/** Full-screen card for the auto driver. Presentational: props only, own EN/MR toggle for which language leads. */
export function DriverCard({ group, station, riderId, lang, onBack }: Props) {
  const [first, setFirst] = useState<Lang>(lang);
  const langs: [Lang, Lang] = [first, other(first)];
  const stops = dropStops(group, riderId, first);
  const total = totalFare(group);

  return (
    <div className={styles.card}>
      <div className={styles.bar}>
        <button type="button" className={styles.barBtn} onClick={onBack}>
          ← {t(copy.driver.back, first)}
        </button>
        <button type="button" className={styles.barBtn} onClick={() => setFirst(other(first))}>
          {t(copy.switchLang, first)}
        </button>
      </div>

      <h1 className={styles.title}>
        <span className={styles.big}>{t(copy.driver.title, langs[0])}</span>
        <span className={styles.small}>{t(copy.driver.title, langs[1])}</span>
      </h1>
      <p className={styles.line}>{copy.rider.stationLine[langs[0]](station)}</p>

      <div className={styles.totalBox}>
        {langs.map((l, i) => (
          <span key={l} className={i === 0 ? styles.totalBig : styles.totalSmall}>
            {copy.driver.total[l](total)}
          </span>
        ))}
        <span className={styles.km}>
          {copy.driver.distance[first](group.totalKm)}
          {group.estimated ? ` · ${t(copy.estimated, first)}` : ""}
        </span>
      </div>

      <div className={styles.meet}>
        {langs.map((l, i) => (
          <span key={l} className={i === 0 ? styles.big : styles.small}>
            {copy.rider.meetAt[l](group.meetAt)}
          </span>
        ))}
      </div>

      <h2 className={styles.h2}>
        {t(copy.driver.stops, langs[0])} / {t(copy.driver.stops, langs[1])}
      </h2>
      <ol className={styles.stops}>
        {stops.map((stop, index) => (
          <li key={stop.id} className={styles.stop}>
            <span className={styles.stopNum}>{index + 1}</span>
            <span className={styles.stopBody}>
              <span className={styles.stopPlace}>{stop.place ?? stop.label}</span>
              <span className={styles.stopShare}>
                {langs.map((l) => copy.driver.share[l](stop.share)).join(" · ")}
              </span>
            </span>
            {!stop.isYou && stop.phone && (
              <CallButton phone={stop.phone} who={stop.label} lang={first} className={styles.callBtn} />
            )}
          </li>
        ))}
      </ol>

      <p className={styles.meter}>
        <span className={styles.big}>{t(copy.driver.runMeter, langs[0])}</span>
        <span className={styles.small}>{t(copy.driver.runMeter, langs[1])}</span>
      </p>
    </div>
  );
}

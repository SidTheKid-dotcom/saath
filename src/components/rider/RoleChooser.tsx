"use client";

import Link from "next/link";
import { copy, t, type Lang } from "../../content/copy";
import type { Station } from "../../lib/types";
import { AutoIcon, UsersIcon } from "./Icons";
import { setRole } from "./role";
import styles from "./Rider.module.css";
import role from "./Role.module.css";

type Props = { station: Station; lang: Lang };

/** First screen on /[station]: riding or driving. The choice is remembered in localStorage. */
export function RoleChooser({ station, lang }: Props) {
  return (
    <section className={styles.step}>
      <div className={styles.body}>
        <p className={role.station}>{copy.rider.stationLine[lang](station.name)}</p>
        <h1 className={styles.title}>{t(copy.role.title, lang)}</h1>
        <div className={role.cards}>
          <button type="button" className={role.card} onClick={() => setRole("rider")}>
            <span className={role.icon}>
              <UsersIcon size={30} />
            </span>
            <span className={role.text}>
              <span className={role.name}>{t(copy.role.riding, lang)}</span>
              <span className={role.sub}>{t(copy.role.ridingSub, lang)}</span>
            </span>
          </button>
          <Link
            href={`/${station.slug}/driver`}
            className={`${role.card} ${role.cardDrive}`}
            onClick={() => setRole("driver")}
          >
            <span className={role.icon}>
              <AutoIcon size={30} />
            </span>
            <span className={role.text}>
              <span className={role.name}>{t(copy.role.driving, lang)}</span>
              <span className={role.sub}>{t(copy.role.drivingSub, lang)}</span>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

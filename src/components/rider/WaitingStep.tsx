import { copy, t, type Lang } from "../../content/copy";
import type { RoomState } from "../../lib/types";
import { GateIcon, UsersIcon } from "./Icons";
import { Progress } from "./Progress";
import styles from "./Rider.module.css";

type Props = {
  lang: Lang;
  state: RoomState | null;
  /** Where to stand until a group gives meetAt: the station's first exit. */
  gate: string;
  failing: boolean;
  onStartOver: () => void;
};

export function WaitingStep({ lang, state, gate, failing, onStartOver }: Props) {
  const waiting = state?.waiting.length ?? null;
  const sameWay = state?.sameWay.length ?? null;
  const matched = sameWay !== null && sameWay > 0;

  return (
    <section className={styles.step}>
      <Progress current={2} lang={lang} />
      <div className={styles.body}>
        <div className={styles.gateCard}>
          <GateIcon size={32} className={styles.gateIcon} />
          <h1 className={styles.gateText}>{copy.rider.waitAt[lang](gate)}</h1>
        </div>

        <div className={styles.liveRow}>
          <span className={styles.pulse} aria-hidden="true" />
          <span className={styles.liveText}>{t(copy.rider.waitingTitle, lang)}</span>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat} aria-label={waiting === null ? undefined : copy.rider.waitingCount[lang](waiting)}>
            <span className={styles.statNumber}>{waiting ?? "–"}</span>
            <span className={styles.statLabel}>{t(copy.rider.waitingLabel, lang)}</span>
          </div>
          <div className={`${styles.stat} ${styles.statAccent}`} aria-label={sameWay === null ? undefined : copy.rider.sameWayCount[lang](sameWay)}>
            <span className={styles.statNumber}>
              <UsersIcon size={22} className={styles.statIcon} />
              {sameWay ?? "–"}
            </span>
            <span className={styles.statLabel}>{t(copy.rider.sameWayLabel, lang)}</span>
          </div>
        </div>

        <div className={styles.nextBox}>
          <p className={styles.nextMain}>
            {state === null
              ? t(copy.rider.checking, lang)
              : matched
                ? copy.rider.waitingMatch[lang](sameWay ?? 0)
                : t(copy.rider.waitingNext, lang)}
          </p>
          {state !== null && (
            <p className={styles.helper}>
              {matched ? t(copy.rider.waitingKeep, lang) : t(copy.rider.waitingTime, lang)}
            </p>
          )}
        </div>

        <p className={`${styles.slow} ${failing ? "" : styles.hidden}`} role="status">
          {failing ? t(copy.rider.slowNetwork, lang) : ""}
        </p>
      </div>

      <div className={styles.dockLink}>
        <button type="button" className={styles.textLink} onClick={onStartOver}>
          {t(copy.rider.cancel, lang)}
        </button>
      </div>
    </section>
  );
}

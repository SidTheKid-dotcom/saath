import { copy, t, type Lang } from "../../content/copy";
import type { RoomState } from "../../lib/types";
import styles from "./Rider.module.css";

type Props = {
  lang: Lang;
  state: RoomState | null;
  failing: boolean;
  onStartOver: () => void;
};

export function WaitingStep({ lang, state, failing, onStartOver }: Props) {
  const waiting = state?.waiting.length ?? null;
  const sameWay = state?.sameWay.length ?? null;

  return (
    <section className={styles.step}>
      <div className={styles.pulseRow}>
        <span className={styles.pulse} aria-hidden="true" />
        <h1 className={styles.titleSmall}>{t(copy.rider.waitingTitle, lang)}</h1>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat} aria-label={waiting === null ? undefined : copy.rider.waitingCount[lang](waiting)}>
          <span className={styles.statNumber}>{waiting ?? "–"}</span>
          <span className={styles.statLabel}>{t(copy.rider.waitingLabel, lang)}</span>
        </div>
        <div className={styles.stat} aria-label={sameWay === null ? undefined : copy.rider.sameWayCount[lang](sameWay)}>
          <span className={styles.statNumber}>{sameWay ?? "–"}</span>
          <span className={styles.statLabel}>{t(copy.rider.sameWayLabel, lang)}</span>
        </div>
      </div>

      {state === null && !failing && <p className={styles.note}>{t(copy.rider.loading, lang)}</p>}
      {failing && (
        <p className={styles.slow} role="status">
          {t(copy.rider.slowNetwork, lang)}
        </p>
      )}

      <p className={styles.note}>{t(copy.rider.waitingHint, lang)}</p>
      <button type="button" className={styles.secondary} onClick={onStartOver}>
        {t(copy.rider.startOver, lang)}
      </button>
    </section>
  );
}

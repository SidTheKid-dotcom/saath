import { copy, t, type Lang } from "../../content/copy";
import type { Group } from "../../lib/types";
import { dropStops, totalFare } from "./groupView";
import styles from "./Rider.module.css";

type Props = {
  lang: Lang;
  group: Group & { meetAt: string };
  riderId: string;
  /** state.estimated from the room; group.estimated is checked too. */
  estimated: boolean;
  onShowDriver: () => void;
};

export function GroupCard({ lang, group, riderId, estimated, onShowDriver }: Props) {
  const stops = dropStops(group, riderId, lang);
  const mine = group.perRider.find((member) => member.id === riderId);
  const total = totalFare(group);
  const share = mine?.share ?? total;
  const saved = mine ? mine.soloFare - mine.share : 0;
  const solo = group.riderIds.length === 1;

  return (
    <section className={styles.step}>
      <h1 className={styles.title}>{t(solo ? copy.rider.soloTitle : copy.rider.groupTitle, lang)}</h1>
      {solo && <p className={styles.sub}>{t(copy.rider.soloHint, lang)}</p>}

      <div className={styles.fareBox}>
        <p className={styles.fareMain}>{copy.rider.yourShare[lang](share, total)}</p>
        {saved > 0 && <p className={styles.saved}>{copy.rider.youSave[lang](saved)}</p>}
        {(group.estimated || estimated) && <span className={styles.pill}>{t(copy.estimated, lang)}</span>}
      </div>

      <p className={styles.meet}>{copy.rider.meetAt[lang](group.meetAt)}</p>

      <h2 className={styles.h2}>{t(copy.rider.dropOrder, lang)}</h2>
      <ol className={styles.drops}>
        {stops.map((stop, index) => (
          <li key={stop.id} className={`${styles.drop} ${stop.isYou ? styles.dropYou : ""}`}>
            <span className={styles.dropNum}>{index + 1}</span>
            <span className={styles.dropBody}>
              <span className={styles.dropWho}>{stop.label}</span>
              {stop.place && <span className={styles.dropPlace}>{stop.place}</span>}
            </span>
          </li>
        ))}
      </ol>

      <p className={styles.fine}>{t(copy.fareRule, lang)}</p>

      <button type="button" className={styles.primary} onClick={onShowDriver}>
        {t(copy.rider.showDriver, lang)}
      </button>
    </section>
  );
}

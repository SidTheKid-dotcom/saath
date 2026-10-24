import { copy, t, type Lang } from "../../content/copy";
import type { Group } from "../../lib/types";
import { CallButton } from "./CallButton";
import { dropStops, totalFare } from "./groupView";
import { AutoIcon, GateIcon } from "./Icons";
import { Progress } from "./Progress";
import styles from "./Rider.module.css";

type Props = {
  lang: Lang;
  group: Group & { meetAt: string };
  riderId: string;
  /** state.estimated from the room; group.estimated is checked too. */
  estimated: boolean;
  onShowDriver: () => void;
  onStartOver: () => void;
};

export function GroupCard({ lang, group, riderId, estimated, onShowDriver, onStartOver }: Props) {
  const stops = dropStops(group, riderId, lang);
  const mine = group.perRider.find((member) => member.id === riderId);
  const total = totalFare(group);
  const share = mine?.share ?? total;
  const saved = mine ? mine.soloFare - mine.share : 0;
  const solo = group.riderIds.length === 1;

  return (
    <section className={`${styles.step} ${styles.withDock}`}>
      <Progress current={3} lang={lang} />
      <div className={styles.body}>
        <div className={styles.gateCard}>
          <GateIcon size={32} className={styles.gateIcon} />
          <h1 className={styles.gateText}>{copy.rider.meetAt[lang](group.meetAt)}</h1>
        </div>

        <div className={styles.fareBox}>
          <p className={styles.fareMain}>{copy.rider.youPay[lang](share)}</p>
          <p className={styles.fareOf}>{copy.rider.ofTotal[lang](total)}</p>
          {saved > 0 && <p className={styles.saved}>{copy.rider.youSave[lang](saved)}</p>}
          {solo && <p className={styles.helper}>{t(copy.rider.soloHint, lang)}</p>}
          {(group.estimated || estimated) && <span className={styles.pill}>{t(copy.estimated, lang)}</span>}
        </div>

        <h2 className={styles.h2}>{t(solo ? copy.rider.soloTitle : copy.rider.people, lang)}</h2>
        <ol className={styles.drops}>
          {stops.map((stop, index) => (
            <li key={stop.id} className={`${styles.drop} ${stop.isYou ? styles.dropYou : ""}`}>
              <span className={styles.dropNum}>{index + 1}</span>
              <span className={styles.dropBody}>
                <span className={styles.dropWho}>{stop.label}</span>
                {stop.place && <span className={styles.dropPlace}>{stop.place}</span>}
              </span>
              {!stop.isYou && stop.phone && (
                <CallButton phone={stop.phone} who={stop.label} lang={lang} className={styles.callBtn} />
              )}
            </li>
          ))}
        </ol>

        <p className={styles.fine}>{t(copy.fareRule, lang)}</p>
        <button type="button" className={styles.textLink} onClick={onStartOver}>
          {t(copy.rider.newTrip, lang)}
        </button>
      </div>

      <div className={styles.dock}>
        <button type="button" className={styles.primary} onClick={onShowDriver}>
          <AutoIcon size={22} />
          {t(copy.rider.showDriver, lang)}
        </button>
      </div>
    </section>
  );
}

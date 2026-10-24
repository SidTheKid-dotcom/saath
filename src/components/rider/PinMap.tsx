"use client";

import dynamic from "next/dynamic";
import { copy, t, type Lang } from "../../content/copy";
import styles from "./Rider.module.css";

const PinMapCanvas = dynamic(() => import("./PinMapCanvas"), {
  ssr: false,
  loading: () => <div className={styles.map} />,
});

type Props = Omit<React.ComponentProps<typeof PinMapCanvas>, "stationLabel" | "pinLabel"> & {
  lang: Lang;
  ready: boolean;
  failed: boolean;
};

export function PinMap({ lang, ready, failed, ...rest }: Props) {
  return (
    <div className={styles.mapWrap}>
      {failed ? (
        <div className={styles.mapFallback} role="status">
          {t(copy.rider.mapError, lang)}
        </div>
      ) : (
        <>
          <PinMapCanvas
            {...rest}
            stationLabel={t(copy.rider.stationLabel, lang)}
            pinLabel={t(copy.rider.pinLabel, lang)}
          />
          {!ready && <div className={styles.mapLoading}>{t(copy.rider.mapLoading, lang)}</div>}
        </>
      )}
    </div>
  );
}

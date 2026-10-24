"use client";

import { useState } from "react";
import { copy, t, type Lang } from "../../content/copy";
import { joinRoom } from "../../lib/api";
import { normalizePhone } from "../../lib/phone";
import type { GeocodeResult, Point, Station } from "../../lib/types";
import { inBbox } from "./geo";
import { BackIcon, PhoneIcon, PinIcon } from "./Icons";
import { PinMap } from "./PinMap";
import { Progress } from "./Progress";
import styles from "./Rider.module.css";

type Props = {
  station: Station;
  lang: Lang;
  dest: GeocodeResult;
  onBack: () => void;
  onJoined: (riderId: string) => void;
};

export function ConfirmStep({ station, lang, dest, onBack, onJoined }: Props) {
  const [pin, setPin] = useState<Point>({ lat: dest.lat, lon: dest.lon });
  const [outside, setOutside] = useState(!inBbox(dest.lat, dest.lon));
  const [ready, setReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [joining, setJoining] = useState(false);
  const [failed, setFailed] = useState(false);

  const normalized = phone.trim() ? normalizePhone(phone) : null;
  const phoneBad = phone.trim() !== "" && normalized === null;
  const showPhoneError = phoneBad && phoneTouched;

  const join = async () => {
    if (phoneBad) {
      setPhoneTouched(true);
      return;
    }
    setJoining(true);
    setFailed(false);
    try {
      const { riderId } = await joinRoom(station.slug, {
        destText: dest.label,
        lat: pin.lat,
        lon: pin.lon,
        ...(normalized ? { phone: normalized } : {}),
      });
      onJoined(riderId);
    } catch {
      setFailed(true);
      setJoining(false);
    }
  };

  return (
    <section className={`${styles.step} ${styles.confirm}`}>
      <Progress current={1} lang={lang} />
      <div className={styles.body}>
        <button type="button" className={styles.backLink} onClick={onBack} disabled={joining}>
          <BackIcon size={20} />
          {t(copy.rider.changeDest, lang)}
        </button>
        <h1 className={styles.titleMid}>{t(copy.rider.confirmTitle, lang)}</h1>
        <p className={styles.destLine}>
          <PinIcon size={18} className={styles.destPin} />
          <span>{dest.label}</span>
        </p>

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
        <p className={styles.helper}>{t(copy.rider.confirmHint, lang)}</p>

        <label className={styles.label} htmlFor="rider-phone">
          {t(copy.rider.phoneLabel, lang)}
        </label>
        <div className={`${styles.phoneBox} ${showPhoneError ? styles.phoneBoxBad : ""}`}>
          <span className={styles.phonePrefix}>
            <PhoneIcon size={18} />
            +91
          </span>
          <input
            id="rider-phone"
            className={styles.phoneInput}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            maxLength={14}
            placeholder="98765 43210"
            value={phone}
            aria-invalid={showPhoneError || undefined}
            aria-describedby="rider-phone-help"
            onChange={(event) => setPhone(event.target.value)}
            onBlur={() => setPhoneTouched(true)}
          />
        </div>
        <p id="rider-phone-help" className={showPhoneError ? styles.fieldError : styles.helper} role={showPhoneError ? "alert" : undefined}>
          {t(showPhoneError ? copy.rider.phoneInvalid : copy.rider.phoneHelper, lang)}
        </p>
      </div>

      <div className={styles.dock}>
        {outside && (
          <p className={styles.errorText} role="alert">
            {t(copy.rider.outsideArea, lang)}
          </p>
        )}
        {failed && (
          <p className={styles.errorText} role="alert">
            {t(copy.rider.joinFailed, lang)}
          </p>
        )}
        <button type="button" className={styles.primary} disabled={joining || outside} onClick={join}>
          {joining && <span className={styles.spinnerLight} aria-hidden="true" />}
          {joining ? t(copy.rider.joining, lang) : t(copy.rider.confirmButton, lang)}
        </button>
      </div>
    </section>
  );
}

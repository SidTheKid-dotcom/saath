"use client";

import { useEffect, useState } from "react";
import { copy, t } from "../../content/copy";
import { geocode } from "../../lib/api";
import type { GeocodeResult, Station } from "../../lib/types";
import { ConfirmStep } from "./ConfirmStep";
import { DestinationStep } from "./DestinationStep";
import { RiderSession } from "./RiderSession";
import { riderKey, useHydrated, useLang, useStored, writeStored } from "./storage";
import styles from "./Rider.module.css";

export type Demo = "confirm" | "waiting" | "group" | "solo" | "driver";

/** Mock riders in src/lib/api.ts: "pending" waits, "rohan" shares with asha, "meera" rides solo. */
const DEMO_RIDER: Record<Exclude<Demo, "confirm">, string> = {
  waiting: "pending",
  group: "rohan",
  solo: "meera",
  driver: "rohan",
};

type Props = {
  /** null when the URL slug is not a known station. */
  station: Station | null;
  /** Dev-only; the page only passes it when NEXT_PUBLIC_USE_MOCK === "1". */
  demo?: Demo;
};

export function RiderApp({ station, demo }: Props) {
  const [lang, setLang] = useLang();
  const hydrated = useHydrated();
  const stored = useStored("session", riderKey(station?.slug ?? ""));
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [dest, setDest] = useState<GeocodeResult | null>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const demoConfirm = demo === "confirm";
  const slug = station?.slug;
  useEffect(() => {
    if (!demoConfirm || !slug) return;
    let cancelled = false;
    geocode("Viman", slug).then((found) => {
      if (!cancelled && found[0]) setDest(found[0]);
    });
    return () => {
      cancelled = true;
    };
  }, [demoConfirm, slug]);

  const riderId = demo ? (demo === "confirm" ? null : DEMO_RIDER[demo]) : stored;

  const startOver = () => {
    if (station) writeStored("session", riderKey(station.slug), null);
    setDest(null);
  };

  let body;
  if (!station) {
    body = (
      <section className={styles.step}>
        <h1 className={styles.title}>{t(copy.errors.unknownStation, lang)}</h1>
      </section>
    );
  } else if (!hydrated) {
    body = (
      <section className={styles.step}>
        <p className={styles.note}>{t(copy.rider.loading, lang)}</p>
      </section>
    );
  } else if (riderId) {
    body = (
      <RiderSession
        key={riderId}
        station={station}
        riderId={riderId}
        lang={lang}
        startOnDriver={demo === "driver"}
        onStartOver={startOver}
      />
    );
  } else if (dest) {
    body = (
      <ConfirmStep
        key={`${dest.lat},${dest.lon}`}
        station={station}
        lang={lang}
        name={name}
        dest={dest}
        onBack={() => setDest(null)}
        onJoined={(id) => writeStored("session", riderKey(station.slug), id)}
      />
    );
  } else {
    body = (
      <DestinationStep
        station={station.slug}
        stationName={station.name}
        lang={lang}
        name={name}
        query={query}
        onName={setName}
        onQuery={setQuery}
        onPick={setDest}
      />
    );
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <span className={styles.brand}>{t(copy.appName, lang)}</span>
        <button
          type="button"
          className={styles.langBtn}
          onClick={() => setLang(lang === "en" ? "mr" : "en")}
          lang={lang === "en" ? "mr" : "en"}
        >
          {t(copy.switchLang, lang)}
        </button>
      </header>
      <main className={styles.main}>{body}</main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { copy, t } from "../../content/copy";
import { geocode } from "../../lib/api";
import type { GeocodeResult, Station } from "../../lib/types";
import { ConfirmStep } from "./ConfirmStep";
import { DestinationStep } from "./DestinationStep";
import { AutoIcon } from "./Icons";
import { RiderSession } from "./RiderSession";
import { setRole, useRole } from "./role";
import { RoleChooser } from "./RoleChooser";
import roleStyles from "./Role.module.css";
import { destKey, riderKey, useHydrated, useLang, useStored, writeStored } from "./storage";
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

function parseDest(raw: string | null): GeocodeResult | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as GeocodeResult;
    return typeof value.lat === "number" && typeof value.lon === "number" && typeof value.label === "string" ? value : null;
  } catch {
    return null;
  }
}

export function RiderApp({ station, demo }: Props) {
  const [lang, setLang] = useLang();
  const hydrated = useHydrated();
  const slug = station?.slug ?? "";
  const stored = useStored("session", riderKey(slug));
  // The picked place survives a refresh, so the rider never lands back on step 1 by accident.
  const storedDest = useStored("session", destKey(slug));
  const savedDest = useMemo(() => parseDest(storedDest), [storedDest]);
  const [demoDest, setDemoDest] = useState<GeocodeResult | null>(null);
  const [query, setQuery] = useState("");
  const dest = demo === "confirm" ? demoDest : savedDest;
  const role = useRole();
  const router = useRouter();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const demoConfirm = demo === "confirm";
  useEffect(() => {
    if (!demoConfirm || !slug) return;
    let cancelled = false;
    geocode("Viman", slug).then((found) => {
      if (!cancelled && found[0]) setDemoDest(found[0]);
    });
    return () => {
      cancelled = true;
    };
  }, [demoConfirm, slug]);

  const riderId = demo ? (demo === "confirm" ? null : DEMO_RIDER[demo]) : stored;
  // A rider mid-session is never sent away; a returning driver goes straight to the driver view.
  const toDriver = hydrated && !demo && !riderId && !dest && role === "driver" && !!slug;
  useEffect(() => {
    if (toDriver) router.replace(`/${slug}/driver`);
  }, [toDriver, slug, router]);

  const setDest = (value: GeocodeResult | null) => {
    if (demoConfirm) setDemoDest(value);
    else writeStored("session", destKey(slug), value ? JSON.stringify(value) : null);
  };

  const startOver = () => {
    if (station) {
      writeStored("session", riderKey(station.slug), null);
      writeStored("session", destKey(station.slug), null);
    }
    setQuery("");
  };

  let body;
  if (!station) {
    body = (
      <section className={styles.step}>
        <h1 className={styles.title}>{t(copy.errors.unknownStation, lang)}</h1>
      </section>
    );
  } else if (!hydrated || toDriver) {
    body = <section className={styles.step} aria-busy="true" />;
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
  } else if (!demo && !dest && role !== "rider") {
    body = <RoleChooser station={station} lang={lang} />;
  } else if (dest) {
    body = (
      <ConfirmStep
        key={`${dest.lat},${dest.lon}`}
        station={station}
        lang={lang}
        dest={dest}
        onBack={() => setDest(null)}
        onJoined={(id) => writeStored("session", riderKey(station.slug), id)}
      />
    );
  } else {
    body = (
      <DestinationStep
        station={station}
        lang={lang}
        query={query}
        onQuery={setQuery}
        onPick={setDest}
      />
    );
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <span className={styles.brand}>
          <span className={styles.brandMark}>
            <AutoIcon size={20} />
          </span>
          {t(copy.appName, lang)}
          {station && <span className={styles.brandStation}>{station.name}</span>}
        </span>
        {station && hydrated && (role === "rider" || !!riderId) && (
          <Link href={`/${station.slug}/driver`} className={roleStyles.switch} onClick={() => setRole("driver")}>
            {t(copy.role.toDriver, lang)}
          </Link>
        )}
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

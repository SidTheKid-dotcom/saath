"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { copy, t, type Lang } from "../../content/copy";
import { getGroups } from "../../lib/api";
import type { Station, StoredGroup } from "../../lib/types";
import { DriverCard } from "../rider/DriverCard";
import { AutoIcon, GateIcon } from "../rider/Icons";
import { setRole } from "../rider/role";
import { useHydrated, useLang } from "../rider/storage";
import riderStyles from "../rider/Rider.module.css";
import roleStyles from "../rider/Role.module.css";
import { driverStops, groupTotal, newestFirst } from "./driverView";
import styles from "./Driver.module.css";

type Props = { station: Station | null };

const POLL_MS = 5000;
const SLOW_MS = 4000;

/** Marathi leads on driver screens; English sits under it. */
function Both({ entry, className }: { entry: Record<Lang, string>; className?: string }) {
  return (
    <span className={className}>
      <span lang="mr">{entry.mr}</span>
      <span lang="en" className={styles.small}>
        {entry.en}
      </span>
    </span>
  );
}

const both = <A extends unknown[]>(f: Record<Lang, (...a: A) => string>, ...a: A) => ({ en: f.en(...a), mr: f.mr(...a) });

export function DriverApp({ station }: Props) {
  const [lang, setLang] = useLang();
  const hydrated = useHydrated();
  const slug = station?.slug ?? "";
  const [groups, setGroups] = useState<StoredGroup[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [slow, setSlow] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      const slowTimer = setTimeout(() => !cancelled && setSlow(true), SLOW_MS);
      try {
        const found = await getGroups(slug);
        if (cancelled) return;
        setGroups(newestFirst(found));
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        clearTimeout(slowTimer);
        if (!cancelled) {
          setSlow(false);
          timer = setTimeout(load, POLL_MS);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug]);

  const open = groups?.find((g) => g.id === openId);
  if (station && open) {
    return <DriverCard group={open.data} station={station.name} riderId={null} lang="mr" onBack={() => setOpenId(null)} />;
  }

  let body;
  if (!station) {
    body = <h1 className={riderStyles.title}>{t(copy.errors.unknownStation, lang)}</h1>;
  } else if (groups === null) {
    body = (
      <div className={styles.state} aria-busy="true">
        <span className={riderStyles.spinner} aria-hidden="true" />
        <Both entry={slow ? copy.driverList.slow : failed ? copy.driverList.error : copy.driverList.loading} />
      </div>
    );
  } else {
    body = (
      <>
        {failed && (
          <div className={riderStyles.errorBox} role="alert">
            <Both entry={copy.driverList.error} />
          </div>
        )}
        {slow && !failed && (
          <p className={riderStyles.helper}>
            <Both entry={copy.driverList.slow} />
          </p>
        )}
        {groups.length === 0 ? (
          <div className={styles.state}>
            <Both entry={copy.driverList.empty} />
          </div>
        ) : (
          <ul className={styles.list}>
            {groups.map((g) => {
              const stops = driverStops(g.data);
              return (
                <li key={g.id}>
                  <button type="button" className={styles.group} onClick={() => setOpenId(g.id)}>
                    <span className={styles.gate}>
                      <GateIcon size={34} className={styles.gateIcon} />
                      {g.data.meetAt}
                    </span>
                    <span className={styles.meta}>
                      <Both entry={both(copy.driverList.riders, stops.length)} />
                      <Both entry={both(copy.driverList.km, g.data.totalKm)} />
                    </span>
                    <ol className={styles.stops}>
                      {stops.map((s, i) => (
                        <li key={s.id} className={styles.stop}>
                          <span className={styles.stopNum}>{i + 1}</span>
                          {s.place ?? <Both entry={both(copy.driverList.stop, i + 1)} />}
                        </li>
                      ))}
                    </ol>
                    <span className={styles.fare}>
                      {copy.driverList.total.mr(groupTotal(g.data))}
                      <span className={styles.fareSmall}>{copy.driverList.total.en(groupTotal(g.data))}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </>
    );
  }

  return (
    <div className={riderStyles.app}>
      <header className={riderStyles.header}>
        <span className={riderStyles.brand}>
          <span className={riderStyles.brandMark}>
            <AutoIcon size={20} />
          </span>
          {t(copy.appName, lang)}
          {station && <span className={riderStyles.brandStation}>{station.name}</span>}
        </span>
        {station && hydrated && (
          <Link href={`/${station.slug}`} className={roleStyles.switch} onClick={() => setRole("rider")}>
            {t(copy.role.toRider, lang)}
          </Link>
        )}
        <button
          type="button"
          className={riderStyles.langBtn}
          onClick={() => setLang(lang === "en" ? "mr" : "en")}
          lang={lang === "en" ? "mr" : "en"}
        >
          {t(copy.switchLang, lang)}
        </button>
      </header>
      <main className={riderStyles.main}>
        <section className={riderStyles.step}>
          <div className={riderStyles.body}>
            <h1 className={riderStyles.title}>
              <Both entry={copy.driverList.title} />
            </h1>
            {body}
          </div>
        </section>
      </main>
    </div>
  );
}

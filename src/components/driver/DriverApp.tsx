"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { copy, t, type Lang } from "../../content/copy";
import { acceptGroup, getGroups } from "../../lib/api";
import type { Station, StoredGroup } from "../../lib/types";
import { DriverCard } from "../rider/DriverCard";
import { AutoIcon, GateIcon } from "../rider/Icons";
import { setRole } from "../rider/role";
import { useHydrated, useLang, useStored, writeStored } from "../rider/storage";
import { DestFilter, type DriverDest } from "./DestFilter";
import { matchGroups } from "./destMatch";
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
  const destKey = `saath-driver-dest-${slug}`;
  const storedDest = useStored("session", destKey);
  const dest = useMemo<DriverDest | null>(() => {
    try {
      const v = storedDest ? (JSON.parse(storedDest) as DriverDest) : null;
      return v && typeof v.lat === "number" && typeof v.lon === "number" ? v : null;
    } catch {
      return null;
    }
  }, [storedDest]);
  const setDest = (d: DriverDest | null) => writeStored("session", destKey, d ? JSON.stringify(d) : null);
  // Groups this driver won, with the riders' phones from the accept response. Kept in sessionStorage so a
  // refresh or coming back from the dialer keeps the Call buttons; the 5 s list poll never carries phones.
  const wonKey = `saath-driver-won-${slug}`;
  const storedWon = useStored("session", wonKey);
  const wonGroups = useMemo<Record<string, StoredGroup>>(() => {
    try {
      return storedWon ? (JSON.parse(storedWon) as Record<string, StoredGroup>) : {};
    } catch {
      return {};
    }
  }, [storedWon]);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Per-group result of this driver's accept tap.
  const [result, setResult] = useState<Record<string, "won" | "taken" | "error">>({});

  const accept = async (id: string) => {
    if (!slug || busyId) return;
    setBusyId(id);
    try {
      const out = await acceptGroup(slug, id);
      if (out === "taken") {
        setResult((r) => ({ ...r, [id]: "taken" }));
      } else {
        setResult((r) => ({ ...r, [id]: "won" }));
        writeStored("session", wonKey, JSON.stringify({ ...wonGroups, [id]: out }));
        setGroups((list) => list?.map((g) => (g.id === id ? out : g)) ?? null);
        setOpenId(id);
      }
    } catch {
      setResult((r) => ({ ...r, [id]: "error" }));
    } finally {
      setBusyId(null);
    }
  };

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

  const open = (openId && wonGroups[openId]) || groups?.find((g) => g.id === openId);
  if (station && open) {
    const won = result[open.id] === "won" || !!wonGroups[open.id];
    return (
      <>
        {won && (
          <p className={styles.wonBar} role="status">
            {copy.driverList.accepted.mr(open.data.meetAt)} · {copy.driverList.accepted.en(open.data.meetAt)}
          </p>
        )}
        <DriverCard group={open.data} station={station.name} riderId={null} lang="mr" onBack={() => setOpenId(null)} />
      </>
    );
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
    const shown = dest ? matchGroups(groups, station, dest) : groups.map((group) => ({ group, lastKm: null as number | null }));
    body = (
      <>
        <DestFilter station={station} groups={groups} dest={dest} onDest={setDest} />
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
        {shown.length === 0 ? (
          <div className={styles.state}>
            <Both entry={groups.length > 0 && dest ? copy.driverList.noneYourWay : copy.driverList.empty} />
          </div>
        ) : (
          <ul className={styles.list}>
            {shown.map(({ group: g, lastKm }) => {
              const stops = driverStops(g.data);
              const mine = result[g.id] === "won" || !!wonGroups[g.id];
              const taken = !mine && (result[g.id] === "taken" || !!g.data.acceptedAt);
              return (
                <li key={g.id} className={styles.item}>
                  <button type="button" className={styles.group} onClick={() => setOpenId(g.id)}>
                    <span className={styles.gate}>
                      <GateIcon size={34} className={styles.gateIcon} />
                      {g.data.meetAt}
                      {taken && (
                        <span className={styles.taken}>
                          {copy.driverList.taken.mr} · {copy.driverList.taken.en}
                        </span>
                      )}
                    </span>
                    <span className={styles.meta}>
                      <Both entry={both(copy.driverList.riders, stops.length)} />
                      <Both entry={both(copy.driverList.km, g.data.totalKm)} />
                    </span>
                    {lastKm !== null && (
                      <span className={styles.lastKm}>
                        <Both entry={both(copy.driverList.lastStop, lastKm)} />
                      </span>
                    )}
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
                  {mine ? (
                    <p className={styles.wonNote} role="status">
                      <Both entry={both(copy.driverList.accepted, g.data.meetAt)} />
                    </p>
                  ) : result[g.id] === "taken" ? (
                    <p className={riderStyles.errorText} role="status">
                      <Both entry={copy.driverList.alreadyTaken} />
                    </p>
                  ) : (
                    !taken && (
                      <button
                        type="button"
                        className={`${riderStyles.primary} ${styles.acceptBtn}`}
                        disabled={busyId !== null}
                        onClick={() => accept(g.id)}
                      >
                        {busyId === g.id ? (
                          <Both entry={copy.driverList.accepting} />
                        ) : (
                          <Both entry={copy.driverList.accept} />
                        )}
                      </button>
                    )
                  )}
                  {result[g.id] === "error" && (
                    <p className={riderStyles.errorText} role="alert">
                      <Both entry={copy.errors.generic} />
                    </p>
                  )}
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

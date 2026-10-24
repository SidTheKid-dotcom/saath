"use client";

import { useState, type FormEvent } from "react";
import { copy } from "../../content/copy";
import { geocode } from "../../lib/api";
import type { Station, StoredGroup } from "../../lib/types";
import { MetroIcon, PinIcon, SearchIcon } from "../rider/Icons";
import { metroMatches } from "../rider/metro";
import riderStyles from "../rider/Rider.module.css";
import { destChips } from "./destMatch";
import styles from "./Driver.module.css";

export type DriverDest = { label: string; lat: number; lon: number };

type Props = {
  station: Station;
  groups: StoredGroup[];
  dest: DriverDest | null;
  onDest: (dest: DriverDest | null) => void;
};

/** "Where are you heading?": local metro matches, geocode search, and chips from current drops. */
export function DestFilter({ station, groups, dest, onDest }: Props) {
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<DriverDest[]>([]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (dest) {
    return (
      <div className={styles.destSet}>
        <span className={styles.destLabel}>
          <PinIcon size={20} />
          <span>
            {copy.driverList.headingTo.mr(dest.label)}
            <span className={styles.small}>{copy.driverList.headingTo.en(dest.label)}</span>
          </span>
        </span>
        <button type="button" className={riderStyles.secondary} onClick={() => onDest(null)}>
          {copy.driverList.showAll.mr} · {copy.driverList.showAll.en}
        </button>
      </div>
    );
  }

  const metro = metroMatches(query, station.slug).map((s) => ({ label: s.name, lat: s.lat, lon: s.lon, metro: true }));
  const chips = destChips(groups);
  const pick = (d: DriverDest) => {
    onDest({ label: d.label, lat: d.lat, lon: d.lon });
    setQuery("");
    setFound([]);
  };

  const search = async (event: FormEvent) => {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setBusy(true);
    setFailed(false);
    try {
      setFound((await geocode(query.trim(), station.slug)).map((r) => ({ label: r.label.split(",")[0], lat: r.lat, lon: r.lon })));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.dest}>
      <h2 className={styles.destTitle}>
        {copy.driverList.heading.mr}
        <span className={styles.small}>{copy.driverList.heading.en}</span>
      </h2>
      <form className={styles.destForm} onSubmit={search}>
        <input
          className={styles.destInput}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`${copy.driverList.headingPlaceholder.mr} / ${copy.driverList.headingPlaceholder.en}`}
          aria-label={copy.driverList.heading.en}
          enterKeyHint="search"
        />
        <button type="submit" className={`${riderStyles.primary} ${styles.destGo}`} disabled={busy} aria-label={copy.driverList.search.en}>
          {busy ? <span className={riderStyles.spinnerLight} aria-hidden="true" /> : <SearchIcon size={22} />}
        </button>
      </form>
      {failed && <p className={riderStyles.errorText}>{copy.errors.generic.mr} · {copy.errors.generic.en}</p>}
      {(metro.length > 0 || found.length > 0) && (
        <ul className={styles.destResults}>
          {[...metro, ...found].map((d) => (
            <li key={`${d.label}-${d.lat}`}>
              <button type="button" className={styles.destResult} onClick={() => pick(d)}>
                {"metro" in d ? <MetroIcon size={20} /> : <PinIcon size={20} />}
                {d.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {chips.length > 0 && (
        <div className={styles.chips}>
          {chips.map((c) => (
            <button key={c.label} type="button" className={styles.chip} onClick={() => pick(c)}>
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { Lang } from "../../content/copy";
import { landing } from "../../content/landing";
import { getStation, lines, stationAliases, stations, type LineId } from "../../lib/stations";
import { matchesQuery, nearestStation, NEAR_LIMIT_KM } from "./nearest";
import styles from "./landing.module.css";

type Locate =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "denied" }
  | { status: "failed" }
  | { status: "far" }
  | { status: "found"; slug: string; km: number };

const LINE_IDS = Object.keys(lines) as LineId[];

function formatKm(km: number) {
  return km < 10 ? km.toFixed(1) : String(Math.round(km));
}

export function StationPicker({ lang }: { lang: Lang }) {
  const [query, setQuery] = useState("");
  const [locate, setLocate] = useState<Locate>({ status: "idle" });
  const searchId = useId();
  const statusId = useId();

  function locateMe() {
    if (!("geolocation" in navigator)) {
      setLocate({ status: "failed" });
      return;
    }
    setLocate({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { station, km } = nearestStation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setQuery("");
        setLocate(km > NEAR_LIMIT_KM ? { status: "far" } : { status: "found", slug: station.slug, km });
      },
      (error) => setLocate({ status: error.code === error.PERMISSION_DENIED ? "denied" : "failed" }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  const nearSlug = locate.status === "found" ? locate.slug : null;
  const nearStation = nearSlug ? getStation(nearSlug) : null;

  const groups = LINE_IDS.map((id) => ({
    id,
    items: lines[id].slugs
      .map((slug) => getStation(slug))
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .filter((s) => matchesQuery(s.name, stationAliases[s.slug] ?? [], query)),
  }));
  const shown = new Set(groups.flatMap((g) => g.items.map((s) => s.slug))).size;

  let message: string | null = null;
  if (locate.status === "locating") message = landing.locating[lang];
  else if (locate.status === "denied") message = landing.locationDenied[lang];
  else if (locate.status === "failed") message = landing.locationFailed[lang];
  else if (locate.status === "far") message = landing.tooFar[lang];

  return (
    <section className={styles.picker} aria-labelledby={`${searchId}-title`} id="stations">
      <h2 id={`${searchId}-title`} className={styles.pickerTitle}>
        {landing.pickTitle[lang]}
      </h2>

      <button type="button" className={styles.locate} onClick={locateMe} disabled={locate.status === "locating"}>
        <svg viewBox="0 0 24 24" className={styles.locateIcon} aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="4" fill="currentColor" />
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12 1v4M12 19v4M1 12h4M19 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {landing.useLocation[lang]}
      </button>

      <div id={statusId} role="status" aria-live="polite">
        {message && <p className={styles.pickerNote}>{message}</p>}
        {nearStation && locate.status === "found" && (
          <Link href={`/${nearStation.slug}`} className={styles.nearest}>
            <span className={styles.nearestLabel}>
              {landing.nearest[lang]} · {landing.away[lang](formatKm(locate.km))}
            </span>
            <span className={styles.nearestName}>
              {landing.goTo[lang]} {nearStation.name} →
            </span>
          </Link>
        )}
      </div>

      <label className={styles.searchLabel} htmlFor={searchId}>
        {landing.searchLabel[lang]}
      </label>
      <input
        id={searchId}
        type="search"
        className={styles.search}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={landing.searchPlaceholder[lang]}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      <div className={styles.list} tabIndex={-1}>
        {shown === 0 && <p className={styles.pickerNote}>{landing.noMatch[lang]}</p>}
        {groups
          .filter((g) => g.items.length > 0)
          .map((g) => (
            <div key={g.id} role="group" aria-labelledby={`${searchId}-${g.id}`} className={styles.group}>
              <h3 id={`${searchId}-${g.id}`} className={styles.groupTitle}>
                <span className={`${styles.dot} ${styles[g.id]}`} aria-hidden="true" />
                {landing.lineName[g.id][lang]}
                <span className={styles.groupRoute}>
                  {lines[g.id].from} → {lines[g.id].to}
                </span>
              </h3>
              <ul className={styles.rows}>
                {g.items.map((s) => {
                  const aka = stationAliases[s.slug];
                  return (
                    <li key={s.slug}>
                      <Link
                        href={`/${s.slug}`}
                        className={`${styles.row} ${s.slug === nearSlug ? styles.rowNear : ""}`}
                      >
                        <span className={styles.rowName}>
                          {s.name}
                          {aka && (
                            <span className={styles.rowAka}>
                              {landing.alsoKnown[lang]} {aka[0]}
                            </span>
                          )}
                        </span>
                        {s.slug === nearSlug && <span className={styles.badge}>{landing.nearest[lang]}</span>}
                        <span className={styles.chevron} aria-hidden="true">
                          →
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
      </div>
      <p className={styles.count}>{landing.stationCount[lang](stations.length)}</p>
    </section>
  );
}

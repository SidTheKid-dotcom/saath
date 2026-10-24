"use client";

import { useEffect, useMemo, useState } from "react";
import { copy, t, type Lang } from "../../content/copy";
import { geocode } from "../../lib/api";
import type { GeocodeResult, Station } from "../../lib/types";
import { ChevronIcon, MetroIcon, PinIcon, SearchIcon } from "./Icons";
import { metroMatches, nearbyMetros } from "./metro";
import { Progress } from "./Progress";
import styles from "./Rider.module.css";

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

type Status = "idle" | "loading" | "done" | "error";

type Props = {
  station: Station;
  lang: Lang;
  query: string;
  onQuery: (query: string) => void;
  onPick: (result: GeocodeResult) => void;
};

export function DestinationStep({ station, lang, query, onQuery, onPick }: Props) {
  const [status, setStatus] = useState<Status>(query.trim().length >= MIN_CHARS ? "loading" : "idle");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [attempt, setAttempt] = useState(0);
  const q = query.trim();
  const metro = useMemo(() => metroMatches(q, station.slug), [q, station.slug]);
  const nearby = useMemo(() => nearbyMetros(station.slug), [station.slug]);

  useEffect(() => {
    if (q.length < MIN_CHARS) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const found = await geocode(q, station.slug);
        if (cancelled) return;
        setResults(found.slice(0, 5));
        setStatus("done");
      } catch {
        if (cancelled) return;
        setResults([]);
        setStatus("error");
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, station.slug, attempt]);

  const change = (value: string) => {
    onQuery(value);
    setResults([]);
    setStatus(value.trim().length >= MIN_CHARS ? "loading" : "idle");
  };

  const retry = () => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  };

  const shown = q.length >= MIN_CHARS ? status : "idle";

  return (
    <section className={styles.step}>
      <Progress current={0} lang={lang} />
      <div className={styles.body}>
        <h1 className={styles.title}>{t(copy.rider.title, lang)}</h1>
        <p className={styles.sub}>{copy.rider.stationLine[lang](station.name)}</p>

        <label className={styles.srOnly} htmlFor="rider-dest">
          {t(copy.rider.destLabel, lang)}
        </label>
        <div className={styles.searchBox}>
          <SearchIcon className={styles.searchIcon} />
          <input
            id="rider-dest"
            className={styles.search}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            // The one thing to do on this screen, so the keyboard comes up straight away.
            autoFocus
            placeholder={t(copy.rider.destPlaceholder, lang)}
            value={query}
            onChange={(event) => change(event.target.value)}
            onKeyDown={(event) => {
              // Enter never picks a suggestion for the rider.
              if (event.key === "Enter") event.preventDefault();
            }}
          />
        </div>
        <p className={styles.helper}>{t(copy.rider.destHelper, lang)}</p>

        {q.length < MIN_CHARS && nearby.length > 0 && (
          <div className={styles.results}>
            <p className={styles.quickLabel}>{t(copy.rider.quickMetro, lang)}</p>
            <ul className={styles.suggestions}>
              {nearby.map((place) => (
                <li key={place.slug}>
                  <button
                    type="button"
                    className={styles.suggestion}
                    onClick={() => onPick({ label: copy.rider.metroPlace.en(place.name), lat: place.lat, lon: place.lon })}
                  >
                    <span className={`${styles.sugIcon} ${styles.sugIconMetro}`}>
                      <MetroIcon size={20} />
                    </span>
                    <span className={styles.sugText}>{copy.rider.metroPlace[lang](place.name)}</span>
                    <span className={styles.badge}>{t(copy.rider.metroBadge, lang)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.results} aria-live="polite">
          {(metro.length > 0 || (shown === "done" && results.length > 0)) && (
            <ul className={styles.suggestions}>
              {metro.map((s) => (
                <li key={`metro-${s.slug}`}>
                  <button
                    type="button"
                    className={styles.suggestion}
                    onClick={() => onPick({ label: copy.rider.metroPlace.en(s.name), lat: s.lat, lon: s.lon })}
                  >
                    <span className={`${styles.sugIcon} ${styles.sugIconMetro}`}>
                      <MetroIcon size={20} />
                    </span>
                    <span className={styles.sugText}>{copy.rider.metroPlace[lang](s.name)}</span>
                    <span className={styles.badge}>{t(copy.rider.metroBadge, lang)}</span>
                  </button>
                </li>
              ))}
              {shown === "done" &&
                results.map((result) => (
                  <li key={`${result.lat},${result.lon},${result.label}`}>
                    <button type="button" className={styles.suggestion} onClick={() => onPick(result)}>
                      <span className={styles.sugIcon}>
                        <PinIcon size={20} />
                      </span>
                      <span className={styles.sugText}>{result.label}</span>
                      <ChevronIcon size={18} className={styles.sugChevron} />
                    </button>
                  </li>
                ))}
            </ul>
          )}
          {shown === "loading" && (
            <p className={styles.searching}>
              <span className={styles.spinner} aria-hidden="true" />
              {t(copy.rider.searching, lang)}
            </p>
          )}
          {shown === "error" && (
            <div className={styles.errorBox} role="alert">
              <p>{t(copy.rider.searchFailed, lang)}</p>
              <button type="button" className={styles.secondary} onClick={retry}>
                {t(copy.rider.retry, lang)}
              </button>
            </div>
          )}
          {shown === "done" && results.length === 0 && metro.length === 0 && (
            <p className={styles.note}>{t(copy.rider.noResults, lang)}</p>
          )}
        </div>
      </div>
    </section>
  );
}

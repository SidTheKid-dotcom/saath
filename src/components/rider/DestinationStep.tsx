"use client";

import { useEffect, useState } from "react";
import { copy, t, type Lang } from "../../content/copy";
import { geocode } from "../../lib/api";
import type { GeocodeResult } from "../../lib/types";
import styles from "./Rider.module.css";

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

type Status = "idle" | "loading" | "done" | "error";

type Props = {
  station: string;
  stationName: string;
  lang: Lang;
  name: string;
  query: string;
  onName: (name: string) => void;
  onQuery: (query: string) => void;
  onPick: (result: GeocodeResult) => void;
};

export function DestinationStep({ station, stationName, lang, name, query, onName, onQuery, onPick }: Props) {
  const [status, setStatus] = useState<Status>(query.trim().length >= MIN_CHARS ? "loading" : "idle");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [attempt, setAttempt] = useState(0);
  const q = query.trim();

  useEffect(() => {
    if (q.length < MIN_CHARS) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const found = await geocode(q, station);
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
  }, [q, station, attempt]);

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
      <h1 className={styles.title}>{t(copy.rider.title, lang)}</h1>
      <p className={styles.sub}>{copy.rider.stationLine[lang](stationName)}</p>

      <label className={styles.label} htmlFor="rider-name">
        {t(copy.rider.nameLabel, lang)}
      </label>
      <input
        id="rider-name"
        className={styles.input}
        type="text"
        autoComplete="given-name"
        maxLength={40}
        value={name}
        onChange={(event) => onName(event.target.value)}
      />

      <label className={styles.label} htmlFor="rider-dest">
        {t(copy.rider.destLabel, lang)}
      </label>
      <input
        id="rider-dest"
        className={styles.input}
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        placeholder={t(copy.rider.destPlaceholder, lang)}
        value={query}
        onChange={(event) => change(event.target.value)}
        onKeyDown={(event) => {
          // Enter never picks a suggestion for the rider.
          if (event.key === "Enter") event.preventDefault();
        }}
      />

      <div className={styles.results} aria-live="polite">
        {shown === "loading" && <p className={styles.note}>{t(copy.rider.searching, lang)}</p>}
        {shown === "error" && (
          <div className={styles.errorBox} role="alert">
            <p>{t(copy.errors.generic, lang)}</p>
            <button type="button" className={styles.secondary} onClick={retry}>
              {t(copy.rider.retry, lang)}
            </button>
          </div>
        )}
        {shown === "done" && results.length === 0 && <p className={styles.note}>{t(copy.rider.noResults, lang)}</p>}
        {shown === "done" && results.length > 0 && (
          <ul className={styles.suggestions}>
            {results.map((result) => (
              <li key={`${result.lat},${result.lon},${result.label}`}>
                <button type="button" className={styles.suggestion} onClick={() => onPick(result)}>
                  {result.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

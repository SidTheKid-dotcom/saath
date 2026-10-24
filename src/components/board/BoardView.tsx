"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import QRCode from "qrcode";
import { copy, type Lang } from "@/content/copy";
import { getGroups } from "@/lib/api";
import { getStation } from "@/lib/stations";
import type { Point, StoredGroup } from "@/lib/types";
import styles from "./board.module.css";
import { getBoardState } from "./boardState";
import { colourForGroup, groupFareTotal, riderTitle, textOn } from "./helpers";
import { boardStrings } from "./strings";

const BoardMap = dynamic(() => import("./BoardMap"), {
  ssr: false,
  loading: () => <div className={styles.mapPending} />,
});

const LANG_KEY = "saath-lang";
const LANG_EVENT = "saath-lang-change";
const POLL_MS = 3000;

function subscribeLang(onChange: () => void) {
  window.addEventListener(LANG_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(LANG_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readLang(): Lang {
  const stored = window.localStorage.getItem(LANG_KEY);
  return stored === "mr" ? "mr" : "en";
}

type Props = {
  slug: string;
};

export default function BoardView({ slug }: Props) {
  const station = getStation(slug);
  const lang = useSyncExternalStore(subscribeLang, readLang, () => "en" as Lang);
  const [waitingCount, setWaitingCount] = useState<number | null>(null);
  const [waitingError, setWaitingError] = useState(false);
  const [waitingPoints, setWaitingPoints] = useState<Record<string, Point>>({});
  const [groups, setGroups] = useState<StoredGroup[]>([]);
  const [groupsReady, setGroupsReady] = useState(false);
  const [groupsError, setGroupsError] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !station) return;
    let cancelled = false;
    const size = window.innerWidth <= 1500 ? 360 : 420;
    const url = `${window.location.origin}/${slug}`;
    QRCode.toCanvas(canvas, url, {
      width: size,
      margin: 4,
      errorCorrectionLevel: "M",
      color: { dark: "#14120b", light: "#ffffff" },
    })
      .then(() => {
        if (cancelled) return;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
      })
      .catch(() => {
        if (!cancelled) setQrFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, station]);

  useEffect(() => {
    if (!station) return;
    let cancelled = false;

    async function load() {
      try {
        const state = await getBoardState(slug);
        if (cancelled) return;
        const count = state.waiting.length;
        setWaitingCount((current) => (current === count ? current : count));
        const points = Object.fromEntries(state.waiting.map((rider) => [rider.id, { lat: rider.lat, lon: rider.lon }]));
        setWaitingPoints((current) => (sameJson(current, points) ? current : points));
        setWaitingError(false);
      } catch {
        if (!cancelled) setWaitingError(true);
      }

      try {
        const next = await getGroups(slug);
        if (cancelled) return;
        setGroups((current) => (sameJson(current, next) ? current : next));
        setGroupsError(false);
      } catch {
        if (!cancelled) setGroupsError(true);
      } finally {
        if (!cancelled) setGroupsReady(true);
      }
    }

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [slug, station]);

  function toggleLang() {
    const next: Lang = lang === "en" ? "mr" : "en";
    window.localStorage.setItem(LANG_KEY, next);
    window.dispatchEvent(new Event(LANG_EVENT));
  }

  const known = useMemo(() => new Map(Object.entries(waitingPoints)), [waitingPoints]);

  if (!station) {
    return (
      <main className={styles.screen} lang={lang}>
        <h1 className={styles.unknown}>{copy.errors.unknownStation[lang]}</h1>
      </main>
    );
  }

  const shown = groups;
  const showProblem = waitingError || groupsError;

  return (
    <main className={styles.screen} lang={lang}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <p className={styles.brandName}>{copy.appName[lang]}</p>
          <p className={styles.stationName}>{station.name}</p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.langButton} onClick={toggleLang}>
            {copy.switchLang[lang]}
          </button>
        </div>
      </header>
      <p className={styles.how}>{copy.board.how[lang]}</p>
      {showProblem ? (
        <p className={styles.alert} role="alert">
          {copy.errors.generic[lang]}
        </p>
      ) : null}
      <div className={styles.body}>
        <section className={styles.left}>
          <h2 id="scan-title" className={styles.scanTitle}>
            {copy.board.scanTitle[lang]}
          </h2>
          <div className={styles.qrWrap}>
            {qrFailed ? (
              <p className={styles.qrFallback}>{`${window.location.origin}/${slug}`}</p>
            ) : (
              <canvas ref={canvasRef} className={styles.qrCanvas} aria-labelledby="scan-title" />
            )}
          </div>
          <div className={styles.wait}>
            <p className={styles.waitLabel}>{copy.board.waiting[lang]}</p>
            {waitingCount === null ? (
              <p className={styles.waitEmpty}>
                {waitingError ? copy.errors.generic[lang] : boardStrings.loading[lang]}
              </p>
            ) : (
              <>
                <p className={styles.waitCount} aria-live="polite">
                  {waitingCount}
                </p>
                {waitingCount === 0 ? <p className={styles.waitEmpty}>{copy.board.noWaiting[lang]}</p> : null}
              </>
            )}
          </div>
        </section>
        <section className={styles.right} aria-label={copy.board.groups[lang]}>
          <div className={styles.mapFrame}>
            <BoardMap station={station} groups={shown} known={known} unavailable={boardStrings.mapUnavailable[lang]} />
          </div>
          <div className={styles.rail}>
            <h2 className={styles.cardsTitle}>{copy.board.groups[lang]}</h2>
            <div className={styles.cards}>
              {!groupsReady ? (
                <p className={styles.empty}>{boardStrings.loading[lang]}</p>
              ) : shown.length === 0 ? (
                <p className={styles.empty}>
                  {groupsError ? copy.errors.generic[lang] : copy.board.noGroups[lang]}
                </p>
              ) : (
                shown.map((stored, index) => (
                  <GroupCard key={stored.id} stored={stored} index={index} lang={lang} />
                ))
              )}
            </div>
          </div>
        </section>
      </div>
      <footer className={styles.footer}>{copy.board.nobodyPaysMore[lang]}</footer>
    </main>
  );
}

function GroupCard({ stored, index, lang }: { stored: StoredGroup; index: number; lang: Lang }) {
  const group = stored.data;
  const colour = colourForGroup(index);
  const members = group.perRider;
  const total = groupFareTotal(members.map((member) => member.share));
  const solo = group.riderIds.length === 1;

  return (
    <article className={styles.card} style={{ borderColor: colour }}>
      <div className={styles.cardHead}>
        <span className={styles.swatch} style={{ background: colour }} aria-hidden="true" />
        <h3 className={styles.groupTitle}>{copy.board.groupLabel[lang](index + 1, group.riderIds.length)}</h3>
        {solo ? <span className={styles.solo}>{copy.board.soloLabel[lang]}</span> : null}
      </div>
      <ol className={styles.riders}>
        {group.riderIds.map((id, dropIndex) => {
          const member = members.find((item) => item.id === id);
          const dest = member?.destText?.trim();
          return (
            <li key={id} className={styles.rider}>
              <span
                className={styles.dropNum}
                style={{ background: colour, color: textOn(colour) }}
                aria-hidden="true"
              >
                {dropIndex + 1}
              </span>
              <div>
                <p className={styles.riderName}>{riderTitle(id, copy.rider.rider[lang](dropIndex + 1))}</p>
                {dest ? <p className={styles.dest}>{dest}</p> : null}
                {member ? (
                  <p className={styles.share}>{boardStrings.shareLine[lang](member.share, member.soloFare)}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
      <p className={styles.total}>{boardStrings.groupFare[lang](total)}</p>
      <p className={styles.meet}>{copy.rider.meetAt[lang](group.meetAt)}</p>
      {group.estimated ? <p className={styles.pill}>{copy.estimated[lang]}</p> : null}
    </article>
  );
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

"use client";

import Link from "next/link";
import { copy, type Lang } from "../../content/copy";
import { landing } from "../../content/landing";
import { splitFare, tariff } from "../../lib/fare";
import { stations } from "../../lib/stations";
import { InstallButton } from "../pwa/InstallButton";
import { useLang } from "../rider/storage";
import { CheckArt, MatchArt, Mark, PinArt, RideArt } from "./Illustrations";
import { StationPicker } from "./StationPicker";
import styles from "./landing.module.css";

const STEP_ART = [PinArt, MatchArt, RideArt];

/** A daytime fare, so the example never shows the night multiplier. */
const NOON = new Date("2026-10-24T12:00:00+05:30");
const EXAMPLE_DROPS_KM = [3, 5, 7];

function exampleSplit() {
  const km = EXAMPLE_DROPS_KM[EXAMPLE_DROPS_KM.length - 1];
  const total = tariff(km, NOON);
  const solo = EXAMPLE_DROPS_KM.map((drop) => tariff(drop, NOON));
  const shares = splitFare(total, solo);
  return {
    km,
    total,
    riders: EXAMPLE_DROPS_KM.map((drop, i) => ({ km: drop, solo: solo[i], share: shares[i] })),
  };
}

export function Landing() {
  const [lang, setLang] = useLang();
  const example = exampleSplit();
  const other: Lang = lang === "en" ? "mr" : "en";

  return (
    <div className={styles.page} lang={lang}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} aria-label={copy.appName[lang]}>
            <Mark className={styles.brandMark} />
            <span>{copy.appName[lang]}</span>
          </Link>
          <button type="button" className={styles.langBtn} onClick={() => setLang(other)} lang={other}>
            {copy.switchLang[lang]}
          </button>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroText}>
              <p className={styles.eyebrow}>{landing.heroEyebrow[lang]}</p>
              <h1 className={styles.title}>{landing.heroTitle[lang]}</h1>
              <p className={styles.lede}>{landing.heroSub[lang]}</p>
            </div>
            <StationPicker lang={lang} />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="how">
          <h2 id="how" className={styles.h2}>
            {landing.howTitle[lang]}
          </h2>
          <ol className={styles.steps}>
            {landing.steps.map((step, i) => {
              const Art = STEP_ART[i];
              return (
                <li key={i} className={styles.step}>
                  <Art className={styles.stepArt} />
                  <span className={styles.stepNum} aria-hidden="true">
                    {i + 1}
                  </span>
                  <h3 className={styles.stepTitle}>{step.title[lang]}</h3>
                  <p className={styles.stepBody}>{step.body[lang]}</p>
                </li>
              );
            })}
          </ol>
        </section>

        <section className={styles.dark} aria-labelledby="fare">
          <div className={styles.darkInner}>
            <div className={styles.fareText}>
              <h2 id="fare" className={styles.h2Dark}>
                {landing.fareTitle[lang]}
              </h2>
              <p className={styles.fareBig}>{landing.fareBig[lang]}</p>
              <p className={styles.fareBody}>{landing.fareBody[lang]}</p>
              <p className={styles.fareSource}>{landing.fareSource[lang]}</p>
            </div>

            <div className={styles.example} role="group" aria-labelledby="example">
              <h3 id="example" className={styles.exampleTitle}>
                {landing.exampleTitle[lang]}
              </h3>
              <p className={styles.exampleRoute}>{landing.exampleRoute[lang](example.km, example.total)}</p>
              <ul className={styles.exampleRows}>
                {example.riders.map((r, i) => (
                  <li key={i} className={styles.exampleRow}>
                    <span className={styles.exampleWho}>
                      <strong>{landing.riderLabel[lang](i + 1)}</strong>
                      <span>{landing.dropAt[lang](r.km)}</span>
                    </span>
                    <span className={styles.exampleMoney}>
                      <strong>
                        {landing.yourShare[lang]} ₹{r.share}
                      </strong>
                      <span>
                        {landing.alone[lang](r.solo)} · {landing.saves[lang](r.solo - r.share)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className={styles.exampleNote}>{landing.exampleNote[lang]}</p>
            </div>
          </div>
        </section>

        <section className={styles.promise} aria-labelledby="promise">
          <div className={styles.promiseInner}>
            <CheckArt className={styles.promiseArt} />
            <div>
              <h2 id="promise" className={styles.promiseTitle}>
                {landing.promiseTitle[lang]}
              </h2>
              <p className={styles.promiseBody}>{landing.promiseBody[lang]}</p>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="install">
          <div className={styles.install}>
            <div>
              <h2 id="install" className={styles.h2Small}>
                {landing.installTitle[lang]}
              </h2>
              <p className={styles.installBody}>{landing.installBody[lang]}</p>
            </div>
            <div className={styles.installAction}>
              <InstallButton
                label={landing.installButton[lang]}
                installedText={landing.installed[lang]}
                fallbackText={landing.installFallback[lang]}
                className={styles.primaryBtn}
                noteClassName={styles.installNote}
                iosSteps={
                  <ol className={styles.iosSteps}>
                    {landing.installIos[lang].map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ol>
                }
              />
            </div>
          </div>
        </section>

        <section className={styles.sectionTight} aria-label={landing.organisersTitle[lang]}>
          <details className={styles.organisers}>
            <summary className={styles.organisersSummary}>{landing.organisersTitle[lang]}</summary>
            <p className={styles.organisersHint}>{landing.organisersHint[lang]}</p>
            <ul className={styles.boardLinks}>
              {stations.map((s) => (
                <li key={s.slug}>
                  <Link href={`/${s.slug}/board`} className={styles.boardLink}>
                    {landing.boardOf[lang](s.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>{landing.footer[lang]}</p>
      </footer>
    </div>
  );
}

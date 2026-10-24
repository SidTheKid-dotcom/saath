import { copy, t, type Lang } from "../../content/copy";
import styles from "./Rider.module.css";

const STEPS = [copy.steps.where, copy.steps.confirm, copy.steps.waiting, copy.steps.auto];

/** Four small dots with labels. `current` is 0-based. */
export function Progress({ current, lang }: { current: number; lang: Lang }) {
  return (
    <nav className={styles.progress} aria-label={copy.steps.progress[lang](current + 1, STEPS.length)}>
      <ol className={styles.progressList}>
        {STEPS.map((step, i) => (
          <li
            key={step.en}
            className={`${styles.progressItem} ${i < current ? styles.progressDone : ""} ${i === current ? styles.progressNow : ""}`}
            aria-current={i === current ? "step" : undefined}
          >
            <span className={styles.progressDot} aria-hidden="true" />
            <span className={styles.progressLabel}>{t(step, lang)}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

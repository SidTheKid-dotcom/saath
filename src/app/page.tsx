import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <h1>Saath</h1>
      <ul>
        <li>
          <Link href="/ramwadi">Ramwadi</Link>
        </li>
        <li>
          <Link href="/vanaz">Vanaz</Link>
        </li>
      </ul>
    </main>
  );
}

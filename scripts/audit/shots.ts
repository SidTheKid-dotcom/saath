/** Needs `npm i --no-save playwright` and `npx playwright install chromium`.
 * Screenshots: tsx scripts/audit/shots.ts <baseUrl>. Output: /tmp/saath-shots/ */
import { mkdirSync } from "node:fs";

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const out = "/tmp/saath-shots";
mkdirSync(out, { recursive: true });

const targets = [
  { name: "rider-360x740", path: "/ramwadi", width: 360, height: 740 },
  { name: "board-1920x1080", path: "/ramwadi/board", width: 1920, height: 1080 },
];

(async () => {
  // Loaded dynamically: playwright is a local-only tool, not a project dependency.
  const pw = "playwright";
  const { chromium } = (await import(pw)) as typeof import("playwright");
  const browser = await chromium.launch();
  for (const t of targets) {
    const page = await browser.newPage({ viewport: { width: t.width, height: t.height } });
    await page.goto(base + t.path, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const file = `${out}/${t.name}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log(file);
    await page.close();
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

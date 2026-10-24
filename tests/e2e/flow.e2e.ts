import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { parseShare, sel } from "./selectors";

const boardKey = process.env.E2E_BOARD_KEY;

// Flip to false once the redesigned rider screens (destination -> pin + phone -> waiting -> group card) are on main.
// The flow below only touches the UI through ./selectors, so the redesign should need edits there only.
const UI_REDESIGN_ON_MAIN = true;

test.skip(!boardKey, "E2E_BOARD_KEY is not set; the UI flow resets and forms the live room.");
test.fixme(!UI_REDESIGN_ON_MAIN, "Rider screens are being redesigned; re-enable when the new flow is on main.");

const destinations = ["Phoenix Marketcity Viman Nagar", "Kalyani Nagar Pune", "Symbiosis Viman Nagar"];

async function openRider(browser: Browser, query: string) {
  const context = await browser.newContext({ viewport: { width: 360, height: 740 }, locale: "en-IN" });
  const page = await context.newPage();
  await page.goto("/ramwadi");
  await sel.rider.destinationInput(page).fill(query);
  await sel.rider.firstSuggestion(page).click();
  await sel.rider.confirmButton(page).click();
  return { context, page };
}

async function readShare(page: Page) {
  const shareText = await sel.rider.shareLine(page).first().innerText();
  const saved = await sel.rider.savedLine(page).count();
  const savedText = saved > 0 ? await sel.rider.savedLine(page).first().innerText() : null;
  return parseShare(shareText, savedText);
}

test("three phones join, the board forms groups, shares add up", async ({ browser, request }) => {
  const reset = () => request.post("/api/rooms/ramwadi/reset", { headers: { "x-board-key": boardKey ?? "" } });
  expect((await reset()).status()).toBe(200);

  const contexts: BrowserContext[] = [];
  try {
    const riders = [];
    for (const query of destinations) {
      const rider = await openRider(browser, query);
      contexts.push(rider.context);
      riders.push(rider);
    }

    const boardContext = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: "en-IN" });
    contexts.push(boardContext);
    const board = await boardContext.newPage();
    board.on("dialog", async (dialog) => {
      if (dialog.type() === "prompt") await dialog.accept(boardKey ?? "");
      else await dialog.dismiss();
    });
    await board.goto("/ramwadi/board");
    await expect(sel.board.formButton(board)).toBeVisible();
    // Wait until all three riders are waiting before forming.
    await expect
      .poll(async () => (await request.get("/api/rooms/ramwadi/state")).json().then((s) => s.waiting.length), {
        timeout: 60_000,
      })
      .toBe(3);
    await sel.board.formButton(board).click();

    const results = [];
    for (const { page } of riders) {
      await expect(sel.rider.shareLine(page).first()).toBeVisible({ timeout: 60_000 });
      results.push(await readShare(page));
    }

    for (const r of results) {
      expect(r.share).toBeLessThanOrEqual(r.soloFare);
      expect(r.share).toBeLessThanOrEqual(r.total);
    }
    // Riders of the same group see the same group total; their shares must add up to it
    // (a multiple of it if two different groups happen to have the same total).
    const byTotal = new Map<number, number[]>();
    for (const r of results) byTotal.set(r.total, [...(byTotal.get(r.total) ?? []), r.share]);
    for (const [total, shares] of byTotal) {
      expect(shares.reduce((a, b) => a + b, 0) % total, `group with total ₹${total}`).toBe(0);
    }
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
    await reset();
  }
});

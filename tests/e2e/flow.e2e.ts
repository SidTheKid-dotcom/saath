import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { parseShare, sel } from "./selectors";

const station = process.env.E2E_STATION ?? "ramwadi";

test.describe.configure({ mode: "serial" });

const phone = { width: 390, height: 844 };

async function openRider(browser: Browser, query: string) {
  const context = await browser.newContext({ viewport: phone, locale: "en-IN" });
  const page = await context.newPage();
  await page.goto(`/${station}`);
  await sel.rider.destinationInput(page).fill(query);
  const place = page.getByRole("listitem").getByRole("button", { name: new RegExp(query.split(" ")[0], "i") });
  await place.first().click();
  await sel.rider.confirmButton(page).click();
  return { context, page };
}

async function readShare(page: Page) {
  const shareText = await sel.rider.shareAmount(page).first().innerText();
  const ofText = await sel.rider.shareOf(page).first().innerText();
  const saved = await sel.rider.savedLine(page).count();
  const savedText = saved > 0 ? await sel.rider.savedLine(page).first().innerText() : null;
  return parseShare(shareText, ofText, savedText);
}

test("two phones join from the station, groups form, a driver accepts, the next driver sees Taken", async ({
  browser,
  request,
}) => {
  const reset = () => request.post(`/api/rooms/${station}/reset`);
  expect((await reset()).status()).toBe(200);

  const contexts: BrowserContext[] = [];
  try {
    const riders = [];
    for (const query of ["Phoenix Marketcity Viman Nagar", "Symbiosis Viman Nagar"]) {
      const rider = await openRider(browser, query);
      contexts.push(rider.context);
      riders.push(rider);
    }

    const boardContext = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "en-IN" });
    contexts.push(boardContext);
    const board = await boardContext.newPage();
    await board.goto(`/${station}/board`);
    await expect(sel.board.how(board)).toBeVisible();
    await expect(board.getByRole("button", { name: "Form groups" })).toHaveCount(0);

    for (const { page } of riders) {
      await expect(sel.rider.shareAmount(page).first()).toBeVisible({ timeout: 60_000 });
    }
    const results = [];
    for (const { page } of riders) results.push(await readShare(page));
    for (const result of results) {
      expect(result.share).toBeGreaterThan(0);
      expect(result.share).toBeLessThanOrEqual(result.soloFare);
      expect(result.share).toBeLessThanOrEqual(result.total);
    }
    const shares = results.map((result) => result.share);
    const total = results[0].total;
    expect(results.every((result) => result.total === total)).toBe(true);
    expect(shares.reduce((sum, share) => sum + share, 0)).toBe(total);

    const driverContext = await browser.newContext({ viewport: phone, locale: "en-IN" });
    contexts.push(driverContext);
    const driver = await driverContext.newPage();
    await driver.goto(`/${station}/driver`);
    await expect(sel.driver.accept(driver).first()).toBeVisible({ timeout: 30_000 });
    await sel.driver.accept(driver).first().click();
    await expect(driver.getByText(/Accepted/)).toBeVisible();

    for (const { page } of riders) {
      await expect(sel.rider.accepted(page)).toBeVisible({ timeout: 20_000 });
    }

    const otherContext = await browser.newContext({ viewport: phone, locale: "en-IN" });
    contexts.push(otherContext);
    const other = await otherContext.newPage();
    await other.goto(`/${station}/driver`);
    await expect(sel.driver.taken(other).first()).toBeVisible({ timeout: 20_000 });
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
    await reset();
  }
});

// Every UI selector the browser flow uses lives here, so a rider-screen redesign is a one-file fix.
// Text comes from src/content/copy.ts (English).
import type { Locator, Page } from "@playwright/test";
import { copy } from "../../src/content/copy";

const en = "en" as const;

export const sel = {
  rider: {
    destinationInput: (page: Page): Locator => page.getByPlaceholder(copy.rider.destPlaceholder[en]),
    firstSuggestion: (page: Page): Locator => page.getByRole("listitem").getByRole("button").first(),
    confirmButton: (page: Page): Locator => page.getByRole("button", { name: copy.rider.confirmButton[en] }),
    shareAmount: (page: Page): Locator => page.getByText(/^You pay ₹\d+/),
    shareOf: (page: Page): Locator => page.getByText(/^of ₹\d+ meter fare/),
    savedLine: (page: Page): Locator => page.getByText(/₹\d+ less than riding alone/),
    accepted: (page: Page): Locator => page.getByText(/An auto has accepted your group/),
  },
  driver: {
    accept: (page: Page): Locator => page.getByRole("button", { name: copy.driverList.accept[en] }),
    taken: (page: Page): Locator => page.getByText(copy.driverList.taken[en]),
  },
  board: {
    how: (page: Page): Locator => page.getByText(copy.board.how[en]),
  },
};

/** Reads "You pay ₹X" and "of ₹Y meter fare", plus an optional saving line. */
export function parseShare(shareText: string, ofText: string, savedText: string | null) {
  const share = Number(/₹(\d+)/.exec(shareText)?.[1]);
  const total = Number(/₹(\d+)/.exec(ofText)?.[1]);
  if (!Number.isFinite(share) || !Number.isFinite(total)) {
    throw new Error(`Unexpected share lines: ${shareText} / ${ofText}`);
  }
  const saved = savedText ? Number(/₹(\d+)/.exec(savedText)?.[1] ?? 0) : 0;
  return { share, total, soloFare: share + saved };
}

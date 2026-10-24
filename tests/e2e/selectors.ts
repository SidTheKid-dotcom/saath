// Every UI selector the browser flow uses lives here, so a rider-screen redesign is a one-file fix.
// Text comes from src/content/copy.ts (English). Where the redesign renames a button, both
// the old and the new wording are accepted.
import type { Locator, Page } from "@playwright/test";
import { copy } from "../../src/content/copy";

const en = "en" as const;

export const sel = {
  rider: {
    destinationInput: (page: Page): Locator => page.getByPlaceholder(copy.rider.destPlaceholder[en]),
    firstSuggestion: (page: Page): Locator => page.getByRole("listitem").getByRole("button").first(),
    confirmButton: (page: Page): Locator =>
      page.getByRole("button", { name: /Find a shared auto|Yes, drop me here/ }),
    // "You pay ₹31 of ₹72"
    shareLine: (page: Page): Locator => page.getByText(/You pay ₹\d+ of ₹\d+/),
    // "₹17 less than riding alone"; absent when the rider pays the full solo fare.
    savedLine: (page: Page): Locator => page.getByText(/₹\d+ less than riding alone/),
  },
  board: {
    formButton: (page: Page): Locator => page.getByRole("button", { name: copy.board.formGroups[en] }),
    // Board uses window.prompt(copy.board.keyPrompt.en); the dialog test reads the same string.
    keyPromptText: copy.board.keyPrompt[en],
  },
};

/** Parses "You pay ₹X of ₹Y" and "₹Z less than riding alone" into numbers. */
export function parseShare(shareText: string, savedText: string | null) {
  const m = /₹(\d+) of ₹(\d+)/.exec(shareText);
  if (!m) throw new Error(`Unexpected share line: ${shareText}`);
  const share = Number(m[1]);
  const total = Number(m[2]);
  const saved = savedText ? Number(/₹(\d+)/.exec(savedText)?.[1] ?? 0) : 0;
  return { share, total, soloFare: share + saved };
}

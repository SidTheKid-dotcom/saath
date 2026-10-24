import { describe, expect, it } from "vitest";
import { copy } from "./copy";

const LANGS = ["en", "mr"] as const;
const BANNED = [/official/i, /rto approved/i, /guaranteed/i];
const SAMPLE_ARGS: unknown[][] = [[1], [2], [1, 2], [2, 3], ["Gate 2"], [1, "Gate 2"], [2, 40, 3]];

type Leaf = { path: string; value: unknown };

function isLeaf(node: object): node is Record<(typeof LANGS)[number], unknown> {
  return "en" in node || "mr" in node;
}

function collect(node: object, path: string, out: Leaf[]) {
  if (isLeaf(node)) {
    out.push({ path, value: node });
    return;
  }
  for (const [key, child] of Object.entries(node)) {
    collect(child as object, path ? `${path}.${key}` : key, out);
  }
}

/** Every string a leaf can produce in one language (functions are called with sample args). */
function strings(fn: unknown): string[] {
  if (typeof fn === "string") return [fn];
  if (typeof fn !== "function") return [];
  const out: string[] = [];
  for (const args of SAMPLE_ARGS) {
    if (args.length !== fn.length) continue;
    try {
      const value = fn(...args);
      if (typeof value === "string") out.push(value);
    } catch {
      // wrong sample types for this function; try the next set
    }
  }
  return out;
}

const leaves: Leaf[] = [];
collect(copy, "", leaves);

describe("copy", () => {
  it("has leaves", () => {
    expect(leaves.length).toBeGreaterThan(40);
  });

  it("gives every leaf a non-empty en and mr", () => {
    for (const leaf of leaves) {
      const node = leaf.value as Record<string, unknown>;
      for (const lang of LANGS) {
        const produced = strings(node[lang]);
        expect(produced.length, `${leaf.path}.${lang} produced no string`).toBeGreaterThan(0);
        for (const text of produced) {
          expect(text.trim().length, `${leaf.path}.${lang} is empty`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("never uses banned words in either language", () => {
    for (const leaf of leaves) {
      const node = leaf.value as Record<string, unknown>;
      for (const lang of LANGS) {
        for (const text of strings(node[lang])) {
          for (const word of BANNED) {
            expect(text, `${leaf.path}.${lang}`).not.toMatch(word);
          }
        }
      }
    }
  });
});

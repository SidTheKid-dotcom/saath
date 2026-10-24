import { beforeEach, describe, expect, it } from "vitest";
import { parseRole, ROLE_KEY, setRole } from "./role";
import { readStored } from "./storage";

describe("role storage", () => {
  beforeEach(() => {
    const data = new Map<string, string>();
    const local = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    };
    (globalThis as unknown as { window: unknown }).window = { localStorage: local, sessionStorage: local };
  });

  it("parses only known roles", () => {
    expect(parseRole("rider")).toBe("rider");
    expect(parseRole("driver")).toBe("driver");
    expect(parseRole("admin")).toBeNull();
    expect(parseRole(null)).toBeNull();
  });

  it("remembers and clears the choice", () => {
    setRole("driver");
    expect(parseRole(readStored("local", ROLE_KEY))).toBe("driver");
    setRole(null);
    expect(readStored("local", ROLE_KEY)).toBeNull();
  });
});

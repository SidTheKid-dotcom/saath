import { describe, expect, it } from "vitest";
import { formatPhone, normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("accepts 10-digit Indian mobiles in common forms", () => {
    for (const input of ["9876543210", "98765 43210", "+91 98765-43210", "919876543210", "09876543210", "(987) 654-3210"]) {
      expect(normalizePhone(input), input).toBe("+919876543210");
    }
  });

  it("rejects numbers that are not Indian mobiles", () => {
    for (const input of ["", "12345", "5876543210", "98765432101", "+1 9876543210", "abcdefghij", "+9198765432"]) {
      expect(normalizePhone(input), input).toBeNull();
    }
  });

  it("formats for display", () => {
    expect(formatPhone("+919876543210")).toBe("98765 43210");
  });
});

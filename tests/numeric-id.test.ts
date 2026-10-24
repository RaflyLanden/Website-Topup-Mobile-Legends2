import { describe, expect, it } from "vitest";
import { generateNumericId } from "@/lib/server/numeric-id";

describe("generateNumericId", () => {
  it("creates a 12 digit ID", () => {
    expect(generateNumericId([])).toMatch(/^\d{12}$/);
  });

  it("does not return an ID already in use", () => {
    const used = new Set(["123456789012"]);
    const generated = generateNumericId(used);
    expect(generated).toMatch(/^\d{12}$/);
    expect(used.has(generated)).toBe(false);
  });
});

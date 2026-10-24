import { describe, expect, it } from "vitest";
import { calculateTotal } from "@/lib/domain/pricing";

describe("calculateTotal", () => {
  it("counts unit price and admin fee correctly", () => {
    expect(calculateTotal({ price: 42000 } as any, 1, 0)).toBe(42000);
    expect(calculateTotal({ price: 21000 } as any, 2, 1000)).toBe(43000);
  });

  it("rejects invalid quantities or negative amounts", () => {
    expect(() => calculateTotal({ price: 1000 } as any, 0)).toThrow();
    expect(() => calculateTotal({ price: -1 } as any, 1)).toThrow();
  });
});

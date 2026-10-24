import { randomInt } from "node:crypto";

const MIN_ID = 100_000_000_000;
const MAX_ID = 1_000_000_000_000;

export function generateNumericId(existingIds: Iterable<string>): string {
  const used = new Set(existingIds);
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const candidate = String(randomInt(MIN_ID, MAX_ID));
    if (!used.has(candidate)) return candidate;
  }
  throw new Error("Could not generate a unique numeric ID.");
}

const attempts = new Map<string, { count: number; resetAt: number }>();
export function allowAttempt(key: string, maximum = 8, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= maximum;
}

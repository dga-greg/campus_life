/**
 * Fixed-window limiter held in process memory. Adequate for one instance;
 * Phase 7 swaps the store for Redis behind this same function so limits hold
 * across serverless instances.
 */
const windows = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): { allowed: boolean; retryAfterSec: number } {
  const w = windows.get(key);
  if (!w || w.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }
  w.count += 1;
  return { allowed: w.count <= limit, retryAfterSec: Math.ceil((w.resetAt - now) / 1000) };
}

export function resetRateLimits(): void {
  windows.clear();
}

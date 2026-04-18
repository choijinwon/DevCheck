/**
 * In-memory fixed-window rate limiter per client key (e.g. IP).
 * Resets when the process restarts; use Redis etc. for multi-instance production.
 */

type Bucket = { windowStart: number; count: number };

const buckets = new Map<string, Bucket>();

/** 테스트에서 카운터를 초기화할 때만 사용합니다. */
export function resetRateLimitBuckets(): void {
  buckets.clear();
}

function windowMs(): number {
  const n = Number(process.env.RATE_LIMIT_WINDOW_MS);
  return Number.isFinite(n) && n > 0 ? n : 60_000;
}

function maxRequests(): number {
  const n = Number(process.env.RATE_LIMIT_MAX);
  return Number.isFinite(n) && n > 0 ? n : 20;
}

function pruneIfNeeded(): void {
  if (buckets.size < 5000) return;
  const w = windowMs();
  const cutoff = Date.now() - 2 * w;
  buckets.forEach((b, k) => {
    if (b.windowStart < cutoff) buckets.delete(k);
  });
}

export function clientKeyFromRequest(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export function checkRateLimit(key: string):
  | { ok: true }
  | { ok: false; retryAfterSec: number } {
  pruneIfNeeded();

  const w = windowMs();
  const max = maxRequests();
  const now = Date.now();

  let b = buckets.get(key);
  if (!b || now - b.windowStart >= w) {
    b = { windowStart: now, count: 0 };
    buckets.set(key, b);
  }

  b.count += 1;
  if (b.count > max) {
    const elapsed = now - b.windowStart;
    const retryAfterMs = Math.max(0, w - elapsed);
    const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000));
    return { ok: false, retryAfterSec };
  }

  return { ok: true };
}

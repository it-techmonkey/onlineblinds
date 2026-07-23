// Simple in-memory sliding-window rate limiter, scoped per serverless instance.
// Good enough to blunt casual abuse/bot hammering without needing a shared store.
// Not perfectly accurate across multiple concurrent instances.

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

// Periodically drop buckets that haven't been touched in a while so this
// doesn't grow unbounded over the lifetime of a warm serverless instance.
const MAX_BUCKET_AGE_MS = 10 * 60 * 1000;
let lastSweep = Date.now();

function sweepStaleBuckets(now: number) {
  if (now - lastSweep < MAX_BUCKET_AGE_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    const newest = bucket.timestamps[bucket.timestamps.length - 1];
    if (!newest || now - newest > MAX_BUCKET_AGE_MS) {
      buckets.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Allows up to `limit` calls per `windowMs` for a given key (e.g. client IP).
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweepStaleBuckets(now);

  const bucket = buckets.get(key) ?? { timestamps: [] };
  const windowStart = now - windowMs;
  bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart);

  if (bucket.timestamps.length >= limit) {
    buckets.set(key, bucket);
    const retryAfterMs = bucket.timestamps[0] + windowMs - now;
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { allowed: true, remaining: limit - bucket.timestamps.length, retryAfterMs: 0 };
}

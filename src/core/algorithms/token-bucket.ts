import type { RateLimitResult, TokenBucketConfig, TokenBucketState } from "../types.js";

export function tokenBucketConfigFromPerSecond(opts: {
  capacity: number;
  refillPerSecond: number;
  cost?: number;
}): TokenBucketConfig {
  return {
    capacity: opts.capacity,
    refillTokensPerMs: opts.refillPerSecond / 1000,
    ...(opts.cost !== undefined ? { cost: opts.cost } : {}),
  };
}

export function tokenBucketConsume(
  state: TokenBucketState | undefined,
  now: number,
  config: TokenBucketConfig,
): { result: RateLimitResult; state: TokenBucketState } {
  const { capacity, refillTokensPerMs } = config;
  const cost = config.cost ?? 1;

  let tokens = state?.tokens ?? capacity;
  let lastRefillAt = state?.lastRefillAt ?? now;

  if (now > lastRefillAt) {
    const elapsed = now - lastRefillAt;
    tokens = Math.min(capacity, tokens + elapsed * refillTokensPerMs);
    lastRefillAt = now;
  }

  const msUntil = (need: number) =>
    refillTokensPerMs <= 0 ? Number.POSITIVE_INFINITY : need / refillTokensPerMs;

  if (tokens >= cost) {
    tokens -= cost;
    return {
      result: {
        allowed: true,
        limit: capacity,
        remaining: Math.floor(tokens / cost),
        resetAt: now + msUntil(Math.max(0, cost - tokens)),
      },
      state: { tokens, lastRefillAt },
    };
  }

  const retryAfterMs = msUntil(cost - tokens);
  return {
    result: {
      allowed: false,
      limit: capacity,
      remaining: 0,
      resetAt: now + retryAfterMs,
      retryAfterMs,
    },
    state: { tokens, lastRefillAt },
  };
}

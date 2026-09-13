import type { FixedWindowConfig, FixedWindowState, RateLimitResult } from "../types.js";

export function fixedWindowConsume(
  state: FixedWindowState | undefined,
  now: number,
  config: FixedWindowConfig,
): { result: RateLimitResult; state: FixedWindowState } {
  const { limit, windowMs } = config;

  const windowExpired = state === undefined || now - state.windowStart >= windowMs;
  const windowStart = windowExpired ? now : state.windowStart;
  const prevCount = windowExpired ? 0 : state.count;
  const resetAt = windowStart + windowMs;

  if (prevCount >= limit) {
    return {
      result: {
        allowed: false,
        limit,
        remaining: 0,
        resetAt,
        retryAfterMs: Math.max(0, resetAt - now),
      },
      state: { count: prevCount, windowStart },
    };
  }

  const count = prevCount + 1;
  return {
    result: {
      allowed: true,
      limit,
      remaining: limit - count,
      resetAt,
    },
    state: { count, windowStart },
  };
}

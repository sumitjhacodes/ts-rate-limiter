export type { Clock } from "./core/clock.js";
export { FakeClock, systemClock } from "./core/clock.js";

export type {
  RateLimitResult,
  FixedWindowConfig,
  FixedWindowState,
  TokenBucketConfig,
  TokenBucketState,
} from "./core/types.js";

export { fixedWindowConsume } from "./core/algorithms/fixed-window.js";
export {
  tokenBucketConsume,
  tokenBucketConfigFromPerSecond,
} from "./core/algorithms/token-bucket.js";

export type { CreateRateLimiterOptions, RateLimiter } from "./core/limiter.js";
export { createRateLimiter, MemoryStore } from "./core/limiter.js";

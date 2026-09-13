export interface RateLimitResult {
  readonly allowed: boolean;
  readonly limit: number;
  readonly remaining: number;
  readonly resetAt: number;
  readonly retryAfterMs?: number;
}

export interface FixedWindowConfig {
  readonly limit: number;
  readonly windowMs: number;
}

export interface FixedWindowState {
  readonly count: number;
  readonly windowStart: number;
}

export interface TokenBucketConfig {
  readonly capacity: number;
  readonly refillTokensPerMs: number;
  readonly cost?: number;
}

export interface TokenBucketState {
  readonly tokens: number;
  readonly lastRefillAt: number;
}

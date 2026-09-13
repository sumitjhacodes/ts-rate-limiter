export interface RateLimitResult {
  readonly allowed: boolean;
  readonly limit: number;
  readonly remaining: number;
  readonly resetAt: number;
  readonly retryAfter?: number;
}

export type RateLimitAlgorithm =
  | "fixed-window";

export interface FixedWindowState {
  readonly count: number;
  readonly windowStart: number;
}
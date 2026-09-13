import type { Clock } from "./clock.js";
import { systemClock } from "./clock.js";
import { fixedWindowConsume } from "./algorithms/fixed-window.js";
import {
  tokenBucketConfigFromPerSecond,
  tokenBucketConsume,
} from "./algorithms/token-bucket.js";
import type {
  FixedWindowState,
  RateLimitResult,
  TokenBucketState,
} from "./types.js";

type StoredState = FixedWindowState | TokenBucketState;

export class MemoryStore {
  private readonly map = new Map<string, StoredState>();

  get(key: string): StoredState | undefined {
    return this.map.get(key);
  }

  set(key: string, state: StoredState): void {
    this.map.set(key, state);
  }
}

export type CreateRateLimiterOptions = {
  clock?: Clock;
  store?: MemoryStore;
} & (
  | { algorithm: "fixed-window"; limit: number; windowMs: number }
  | {
      algorithm: "token-bucket";
      capacity: number;
      refillPerSecond: number;
      cost?: number;
    }
);

export interface RateLimiter {
  consume(key: string): Promise<RateLimitResult>;
}

export function createRateLimiter(opts: CreateRateLimiterOptions): RateLimiter {
  const clock = opts.clock ?? systemClock;
  const store = opts.store ?? new MemoryStore();

  return {
    async consume(key: string): Promise<RateLimitResult> {
      const now = clock.now();
      const prev = store.get(key);

      if (opts.algorithm === "fixed-window") {
        const { result, state } = fixedWindowConsume(
          prev as FixedWindowState | undefined,
          now,
          { limit: opts.limit, windowMs: opts.windowMs },
        );
        store.set(key, state);
        return result;
      }

      const { result, state } = tokenBucketConsume(
        prev as TokenBucketState | undefined,
        now,
        tokenBucketConfigFromPerSecond({
          capacity: opts.capacity,
          refillPerSecond: opts.refillPerSecond,
          ...(opts.cost !== undefined ? { cost: opts.cost } : {}),
        }),
      );
      store.set(key, state);
      return result;
    },
  };
}

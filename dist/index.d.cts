interface Clock {
    now(): number;
}
declare const systemClock: Clock;
/** Controllable clock for tests. */
declare class FakeClock implements Clock {
    private ms;
    constructor(ms?: number);
    now(): number;
    set(ms: number): void;
    advance(ms: number): void;
}

interface RateLimitResult {
    readonly allowed: boolean;
    readonly limit: number;
    readonly remaining: number;
    readonly resetAt: number;
    readonly retryAfterMs?: number;
}
interface FixedWindowConfig {
    readonly limit: number;
    readonly windowMs: number;
}
interface FixedWindowState {
    readonly count: number;
    readonly windowStart: number;
}
interface TokenBucketConfig {
    readonly capacity: number;
    readonly refillTokensPerMs: number;
    readonly cost?: number;
}
interface TokenBucketState {
    readonly tokens: number;
    readonly lastRefillAt: number;
}

declare function fixedWindowConsume(state: FixedWindowState | undefined, now: number, config: FixedWindowConfig): {
    result: RateLimitResult;
    state: FixedWindowState;
};

declare function tokenBucketConfigFromPerSecond(opts: {
    capacity: number;
    refillPerSecond: number;
    cost?: number;
}): TokenBucketConfig;
declare function tokenBucketConsume(state: TokenBucketState | undefined, now: number, config: TokenBucketConfig): {
    result: RateLimitResult;
    state: TokenBucketState;
};

type StoredState = FixedWindowState | TokenBucketState;
declare class MemoryStore {
    private readonly map;
    get(key: string): StoredState | undefined;
    set(key: string, state: StoredState): void;
}
type CreateRateLimiterOptions = {
    clock?: Clock;
    store?: MemoryStore;
} & ({
    algorithm: "fixed-window";
    limit: number;
    windowMs: number;
} | {
    algorithm: "token-bucket";
    capacity: number;
    refillPerSecond: number;
    cost?: number;
});
interface RateLimiter {
    consume(key: string): Promise<RateLimitResult>;
}
declare function createRateLimiter(opts: CreateRateLimiterOptions): RateLimiter;

export { type Clock, type CreateRateLimiterOptions, FakeClock, type FixedWindowConfig, type FixedWindowState, MemoryStore, type RateLimitResult, type RateLimiter, type TokenBucketConfig, type TokenBucketState, createRateLimiter, fixedWindowConsume, systemClock, tokenBucketConfigFromPerSecond, tokenBucketConsume };

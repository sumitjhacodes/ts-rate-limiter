import { describe, it, expect } from "vitest";
import {
  tokenBucketConfigFromPerSecond,
  tokenBucketConsume,
} from "../src/core/algorithms/token-bucket.js";

const config = tokenBucketConfigFromPerSecond({
  capacity: 5,
  refillPerSecond: 1,
});

describe("tokenBucketConsume", () => {
  it("allows burst up to capacity then denies", () => {
    let state = undefined;
    const now = 0;

    for (let i = 0; i < 5; i++) {
      const r = tokenBucketConsume(state, now, config);
      expect(r.result.allowed).toBe(true);
      state = r.state;
    }

    const denied = tokenBucketConsume(state, now, config);
    expect(denied.result.allowed).toBe(false);
    expect(denied.result.retryAfterMs).toBe(1000);
  });

  it("refills with elapsed time and caps at capacity", () => {
    let state = tokenBucketConsume(undefined, 0, config).state;
    for (let i = 0; i < 4; i++) {
      state = tokenBucketConsume(state, 0, config).state;
    }

    const r = tokenBucketConsume(state, 10_000, config);
    expect(r.result.allowed).toBe(true);
    expect(r.state.tokens).toBeCloseTo(4, 5);
  });

  it("partial refill unlocks after deficit wait", () => {
    let state = undefined;
    const t = 0;

    for (let i = 0; i < 5; i++) {
      state = tokenBucketConsume(state, t, config).state;
    }

    const denied = tokenBucketConsume(state, t, config);
    expect(denied.result.retryAfterMs).toBe(1000);

    const half = tokenBucketConsume(denied.state, t + 500, config);
    expect(half.result.allowed).toBe(false);
    expect(half.result.retryAfterMs).toBeCloseTo(500, 0);

    const ok = tokenBucketConsume(denied.state, t + 1000, config);
    expect(ok.result.allowed).toBe(true);
  });
});

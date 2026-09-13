import { describe, it, expect } from "vitest";
import { FakeClock } from "../src/core/clock.js";
import { createRateLimiter } from "../src/core/limiter.js";

describe("createRateLimiter", () => {
  it("fixed-window: denies then allows after clock.advance", async () => {
    const clock = new FakeClock(0);
    const limiter = createRateLimiter({
      algorithm: "fixed-window",
      limit: 2,
      windowMs: 1_000,
      clock,
    });

    expect((await limiter.consume("a")).allowed).toBe(true);
    expect((await limiter.consume("a")).allowed).toBe(true);

    const denied = await limiter.consume("a");
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterMs).toBe(1_000);

    clock.advance(1_000);
    expect((await limiter.consume("a")).allowed).toBe(true);
  });

  it("token-bucket: refills after clock.advance", async () => {
    const clock = new FakeClock(0);
    const limiter = createRateLimiter({
      algorithm: "token-bucket",
      capacity: 2,
      refillPerSecond: 1,
      clock,
    });

    expect((await limiter.consume("a")).allowed).toBe(true);
    expect((await limiter.consume("a")).allowed).toBe(true);
    expect((await limiter.consume("a")).allowed).toBe(false);

    clock.advance(1_000);
    expect((await limiter.consume("a")).allowed).toBe(true);
  });

  it("isolates keys", async () => {
    const clock = new FakeClock(0);
    const limiter = createRateLimiter({
      algorithm: "fixed-window",
      limit: 1,
      windowMs: 60_000,
      clock,
    });

    expect((await limiter.consume("a")).allowed).toBe(true);
    expect((await limiter.consume("a")).allowed).toBe(false);
    expect((await limiter.consume("b")).allowed).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { fixedWindowConsume } from "../src/core/algorithms/fixed-window.js";

const config = { limit: 3, windowMs: 60_000 };

describe("fixedWindowConsume", () => {
  it("allows up to limit then denies in the same window", () => {
    let state = undefined;
    const t0 = 1_000;

    let r = fixedWindowConsume(state, t0, config);
    expect(r.result.allowed).toBe(true);
    expect(r.result.remaining).toBe(2);
    expect(r.state.windowStart).toBe(t0);
    state = r.state;

    r = fixedWindowConsume(state, t0 + 10, config);
    expect(r.result.allowed).toBe(true);
    expect(r.result.remaining).toBe(1);
    state = r.state;

    r = fixedWindowConsume(state, t0 + 20, config);
    expect(r.result.allowed).toBe(true);
    expect(r.result.remaining).toBe(0);
    state = r.state;

    r = fixedWindowConsume(state, t0 + 30, config);
    expect(r.result.allowed).toBe(false);
    expect(r.result.remaining).toBe(0);
    expect(r.result.retryAfterMs).toBe(60_000 - 30);
    expect(r.state.count).toBe(3);
  });

  it("resets after windowMs elapses", () => {
    let state = undefined;
    const t0 = 0;

    for (let i = 0; i < 3; i++) {
      state = fixedWindowConsume(state, t0, config).state;
    }

    const denied = fixedWindowConsume(state, t0 + 1, config);
    expect(denied.result.allowed).toBe(false);

    const next = fixedWindowConsume(state, t0 + 60_000, config);
    expect(next.result.allowed).toBe(true);
    expect(next.result.remaining).toBe(2);
    expect(next.state.count).toBe(1);
    expect(next.state.windowStart).toBe(t0 + 60_000);
  });

  it("creates state on first request", () => {
    const r = fixedWindowConsume(undefined, 500, config);
    expect(r.state).toEqual({ count: 1, windowStart: 500 });
    expect(r.result.resetAt).toBe(500 + 60_000);
  });
});

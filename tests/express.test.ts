import { describe, it, expect, vi } from "vitest";
import { FakeClock } from "../src/core/clock.js";
import { createRateLimiter } from "../src/core/limiter.js";
import { rateLimit } from "../src/adapters/express.js";

function mockRes() {
  const headers = new Map<string, string>();
  return {
    headers,
    setHeader: vi.fn((k: string, v: string) => {
      headers.set(k, v);
    }),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe("express rateLimit", () => {
  it("calls next when allowed and sets headers", async () => {
    const clock = new FakeClock(0);
    const limiter = createRateLimiter({
      algorithm: "fixed-window",
      limit: 2,
      windowMs: 60_000,
      clock,
    });
    const middleware = rateLimit({
      limiter,
      key: () => "user:1",
    });

    const res = mockRes();
    const next = vi.fn();

    await middleware({} as never, res as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.headers.get("X-RateLimit-Limit")).toBe("2");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("1");
  });

  it("returns 429 when denied", async () => {
    const clock = new FakeClock(0);
    const limiter = createRateLimiter({
      algorithm: "fixed-window",
      limit: 1,
      windowMs: 60_000,
      clock,
    });
    const middleware = rateLimit({
      limiter,
      key: () => "user:1",
    });

    const next = vi.fn();
    await middleware({} as never, mockRes() as never, next);
    expect(next).toHaveBeenCalledOnce();

    const res = mockRes();
    const next2 = vi.fn();
    await middleware({} as never, res as never, next2);

    expect(next2).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({ error: "Too Many Requests" });
    expect(res.headers.get("Retry-After")).toBe("60");
  });
});

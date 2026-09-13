import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { RateLimiter } from "../core/limiter.js";
import type { RateLimitResult } from "../core/types.js";

export type KeyGenerator = (req: Request) => string;

export interface ExpressRateLimitOptions {
  limiter: RateLimiter;
  key?: KeyGenerator;
}

function setRateLimitHeaders(res: Response, result: RateLimitResult): void {
  res.setHeader("X-RateLimit-Limit", String(result.limit));
  res.setHeader("X-RateLimit-Remaining", String(result.remaining));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
}

export function rateLimit(options: ExpressRateLimitOptions): RequestHandler {
  const keyOf = options.key ?? ((req) => req.ip ?? "unknown");

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await options.limiter.consume(keyOf(req));
      setRateLimitHeaders(res, result);

      if (!result.allowed) {
        if (result.retryAfterMs !== undefined) {
          res.setHeader(
            "Retry-After",
            String(Math.max(1, Math.ceil(result.retryAfterMs / 1000))),
          );
        }
        res.status(429).json({ error: "Too Many Requests" });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

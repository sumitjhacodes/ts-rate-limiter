# ts-rate-limiter

Framework-agnostic rate limiting for Node.js. Pure algorithms, in-memory store, thin Express adapter.

**MVP algorithms:** fixed window, token bucket.

## Install

```bash
pnpm add ts-rate-limiter
```

For Express:

```bash
pnpm add ts-rate-limiter express
```

## Quick start

```ts
import { createRateLimiter } from "ts-rate-limiter";

const limiter = createRateLimiter({
  algorithm: "fixed-window",
  limit: 100,
  windowMs: 60_000,
});

const result = await limiter.consume("user:42");

if (!result.allowed) {
  // result.retryAfterMs — wait before retrying
}
```

### Token bucket

```ts
const limiter = createRateLimiter({
  algorithm: "token-bucket",
  capacity: 20,        // burst
  refillPerSecond: 10, // sustained rate
});
```

### Result shape

| Field | Meaning |
|--------|---------|
| `allowed` | Whether the request may proceed |
| `limit` | Configured max (window limit or capacity) |
| `remaining` | Requests left right now |
| `resetAt` | Epoch ms when the limit recovers |
| `retryAfterMs` | Present when denied |

## Express

```ts
import express from "express";
import { createRateLimiter } from "ts-rate-limiter";
import { rateLimit } from "ts-rate-limiter/express";

const app = express();

const limiter = createRateLimiter({
  algorithm: "token-bucket",
  capacity: 20,
  refillPerSecond: 10,
});

app.use(
  rateLimit({
    limiter,
    key: (req) => req.ip ?? "unknown",
  }),
);
```

On allow/deny the middleware sets:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset` (unix seconds)
- `Retry-After` (seconds, on 429 only)

Denied requests get `429` with `{ error: "Too Many Requests" }`.

## Testing with FakeClock

```ts
import { createRateLimiter, FakeClock } from "ts-rate-limiter";

const clock = new FakeClock(0);
const limiter = createRateLimiter({
  algorithm: "fixed-window",
  limit: 2,
  windowMs: 1_000,
  clock,
});

await limiter.consume("a");
clock.advance(1_000); // no real waiting
```

## API notes

- **Core** has no Express dependency. Import adapters from `ts-rate-limiter/express`.
- **Memory store** is per process. Restart clears limits; multiple Node instances do not share state.
- Algorithms are pure and exported if you want to bring your own store.

## Scripts

```bash
pnpm test
pnpm typecheck
pnpm build
```

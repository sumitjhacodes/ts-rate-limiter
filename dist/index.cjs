"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  FakeClock: () => FakeClock,
  MemoryStore: () => MemoryStore,
  createRateLimiter: () => createRateLimiter,
  fixedWindowConsume: () => fixedWindowConsume,
  systemClock: () => systemClock,
  tokenBucketConfigFromPerSecond: () => tokenBucketConfigFromPerSecond,
  tokenBucketConsume: () => tokenBucketConsume
});
module.exports = __toCommonJS(index_exports);

// src/core/clock.ts
var systemClock = {
  now: () => Date.now()
};
var FakeClock = class {
  constructor(ms = 0) {
    this.ms = ms;
  }
  ms;
  now() {
    return this.ms;
  }
  set(ms) {
    this.ms = ms;
  }
  advance(ms) {
    this.ms += ms;
  }
};

// src/core/algorithms/fixed-window.ts
function fixedWindowConsume(state, now, config) {
  const { limit, windowMs } = config;
  const windowExpired = state === void 0 || now - state.windowStart >= windowMs;
  const windowStart = windowExpired ? now : state.windowStart;
  const prevCount = windowExpired ? 0 : state.count;
  const resetAt = windowStart + windowMs;
  if (prevCount >= limit) {
    return {
      result: {
        allowed: false,
        limit,
        remaining: 0,
        resetAt,
        retryAfterMs: Math.max(0, resetAt - now)
      },
      state: { count: prevCount, windowStart }
    };
  }
  const count = prevCount + 1;
  return {
    result: {
      allowed: true,
      limit,
      remaining: limit - count,
      resetAt
    },
    state: { count, windowStart }
  };
}

// src/core/algorithms/token-bucket.ts
function tokenBucketConfigFromPerSecond(opts) {
  return {
    capacity: opts.capacity,
    refillTokensPerMs: opts.refillPerSecond / 1e3,
    ...opts.cost !== void 0 ? { cost: opts.cost } : {}
  };
}
function tokenBucketConsume(state, now, config) {
  const { capacity, refillTokensPerMs } = config;
  const cost = config.cost ?? 1;
  let tokens = state?.tokens ?? capacity;
  let lastRefillAt = state?.lastRefillAt ?? now;
  if (now > lastRefillAt) {
    const elapsed = now - lastRefillAt;
    tokens = Math.min(capacity, tokens + elapsed * refillTokensPerMs);
    lastRefillAt = now;
  }
  const msUntil = (need) => refillTokensPerMs <= 0 ? Number.POSITIVE_INFINITY : need / refillTokensPerMs;
  if (tokens >= cost) {
    tokens -= cost;
    return {
      result: {
        allowed: true,
        limit: capacity,
        remaining: Math.floor(tokens / cost),
        resetAt: now + msUntil(Math.max(0, cost - tokens))
      },
      state: { tokens, lastRefillAt }
    };
  }
  const retryAfterMs = msUntil(cost - tokens);
  return {
    result: {
      allowed: false,
      limit: capacity,
      remaining: 0,
      resetAt: now + retryAfterMs,
      retryAfterMs
    },
    state: { tokens, lastRefillAt }
  };
}

// src/core/limiter.ts
var MemoryStore = class {
  map = /* @__PURE__ */ new Map();
  get(key) {
    return this.map.get(key);
  }
  set(key, state) {
    this.map.set(key, state);
  }
};
function createRateLimiter(opts) {
  const clock = opts.clock ?? systemClock;
  const store = opts.store ?? new MemoryStore();
  return {
    async consume(key) {
      const now = clock.now();
      const prev = store.get(key);
      if (opts.algorithm === "fixed-window") {
        const { result: result2, state: state2 } = fixedWindowConsume(
          prev,
          now,
          { limit: opts.limit, windowMs: opts.windowMs }
        );
        store.set(key, state2);
        return result2;
      }
      const { result, state } = tokenBucketConsume(
        prev,
        now,
        tokenBucketConfigFromPerSecond({
          capacity: opts.capacity,
          refillPerSecond: opts.refillPerSecond,
          ...opts.cost !== void 0 ? { cost: opts.cost } : {}
        })
      );
      store.set(key, state);
      return result;
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FakeClock,
  MemoryStore,
  createRateLimiter,
  fixedWindowConsume,
  systemClock,
  tokenBucketConfigFromPerSecond,
  tokenBucketConsume
});
//# sourceMappingURL=index.cjs.map
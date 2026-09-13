export interface Clock {
  now(): number;
}

export const systemClock: Clock = {
  now: () => Date.now(),
};

/** Controllable clock for tests. */
export class FakeClock implements Clock {
  constructor(private ms: number = 0) {}

  now(): number {
    return this.ms;
  }

  set(ms: number): void {
    this.ms = ms;
  }

  advance(ms: number): void {
    this.ms += ms;
  }
}

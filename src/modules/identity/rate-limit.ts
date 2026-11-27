/**
 * Sliding-window limiter. In-memory, so it is per server instance only.
 * Before production, back this with a shared store (database or Redis) behind the same interface.
 */
export class RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  check(key: string): { allowed: boolean; retryAfterMs: number } {
    const t = this.now();
    const recent = (this.hits.get(key) ?? []).filter((x) => t - x < this.windowMs);
    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      return { allowed: false, retryAfterMs: this.windowMs - (t - recent[0]!) };
    }
    recent.push(t);
    this.hits.set(key, recent);
    if (this.hits.size > 10_000) this.prune(t);
    return { allowed: true, retryAfterMs: 0 };
  }

  private prune(t: number) {
    for (const [k, v] of this.hits) {
      if (v.every((x) => t - x >= this.windowMs)) this.hits.delete(k);
    }
  }
}

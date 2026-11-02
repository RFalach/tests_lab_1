import type { Clock } from './clock';
import type { HttpClient } from './http-client';

export class RateLimiter {
  private timestamps: number[] = [];

  constructor(
    private http: HttpClient,
    private clock: Clock,
    private maxCalls = 3,
    private windowMs = 10_000,
  ) {}

  async call<T>(url: string): Promise<T> {
    const now = this.clock.now();

    this.timestamps = this.timestamps.filter(
      (t) => now - t < this.windowMs,
    );

    if (this.timestamps.length >= this.maxCalls) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    this.timestamps.push(now);
    return this.http.get<T>(url);
  }
}

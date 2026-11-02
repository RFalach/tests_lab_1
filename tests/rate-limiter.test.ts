import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RateLimiter } from '../src/rate-limiter';
import { FakeClock } from './fakes/fake-clock';
import type { HttpClient } from '../src/http-client';

describe('RateLimiter', () => {
  let clock: FakeClock;
  let http: HttpClient;
  let limiter: RateLimiter;

  beforeEach(() => {
    clock = new FakeClock(0);
    http = { get: vi.fn().mockResolvedValue({ value: 42 }) };
    limiter = new RateLimiter(http, clock);
  });

  it('дозволяє 3 виклики за 10 секунд', async () => {
    await limiter.call('/data');
    await limiter.call('/data');
    await limiter.call('/data');

    expect(http.get).toHaveBeenCalledTimes(3);
  });

  it('4-й виклик у межах вікна кидає RATE_LIMIT_EXCEEDED і НЕ звертається до HTTP', async () => {
    await limiter.call('/data');
    await limiter.call('/data');
    await limiter.call('/data');

    await expect(limiter.call('/data')).rejects.toThrow('RATE_LIMIT_EXCEEDED');

    expect(http.get).toHaveBeenCalledTimes(3);
  });

  it('на межі 9999 мс ще блокує, 10000 мс — уже пропускає', async () => {
    await limiter.call('/data');
    await limiter.call('/data');
    await limiter.call('/data');

    clock.advance(9_999);
    await expect(limiter.call('/data')).rejects.toThrow('RATE_LIMIT_EXCEEDED');

    clock.advance(1);
    await expect(limiter.call('/data')).resolves.toEqual({ value: 42 });

    expect(http.get).toHaveBeenCalledTimes(4);
  });
    
  it('на межі 10001 мс пропускає', async () => {
    await limiter.call('/data');
    await limiter.call('/data');
    await limiter.call('/data');

    clock.advance(10_001);
    await expect(limiter.call('/data')).resolves.toEqual({ value: 42 });
  });

  it('прокидає помилку HTTP, якщо запит не вдався', async () => {
    http.get = vi.fn().mockRejectedValue(new Error('HTTP_500'));

    await expect(limiter.call('/data')).rejects.toThrow('HTTP_500');
  });

  it('списує спробу навіть якщо HTTP впав', async () => {
    http.get = vi
      .fn()
      .mockRejectedValueOnce(new Error('HTTP_500'))
      .mockResolvedValue({ value: 42 });

    await expect(limiter.call('/data')).rejects.toThrow('HTTP_500');

    await limiter.call('/data');
    await limiter.call('/data');

    await expect(limiter.call('/data')).rejects.toThrow('RATE_LIMIT_EXCEEDED');
  });

  it('після часткового спливання вікна дозволяє нові виклики', async () => {
    await limiter.call('/data');
    clock.advance(5_000);
    await limiter.call('/data');
    await limiter.call('/data');

    await expect(limiter.call('/data')).rejects.toThrow('RATE_LIMIT_EXCEEDED');

    clock.advance(5_000);
    await expect(limiter.call('/data')).resolves.toEqual({ value: 42 });
  });
});

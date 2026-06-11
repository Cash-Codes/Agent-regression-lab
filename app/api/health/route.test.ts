import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('GET /api/health', () => {
  it('returns 200 with status "ok" and a numeric timestamp', async () => {
    const before = Date.now();
    const response = await GET();
    const after = Date.now();

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      status: string;
      timestamp: number;
    };
    expect(body.status).toBe('ok');
    expect(typeof body.timestamp).toBe('number');
    expect(body.timestamp).toBeGreaterThanOrEqual(before);
    expect(body.timestamp).toBeLessThanOrEqual(after);
  });
});

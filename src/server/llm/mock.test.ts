import { describe, it, expect } from 'vitest';
import { MockLLMClient, MockResponseMissing } from './mock';

describe('MockLLMClient', () => {
  it('returns the registered response when the last user message matches a substring', async () => {
    const client = new MockLLMClient([
      {
        match: 'refund',
        response: {
          model: 'mock',
          content: "I'll check on that.",
          stopReason: 'end_turn',
        },
      },
    ]);
    const res = await client.complete({
      model: 'mock',
      messages: [
        { role: 'system', content: 'be helpful' },
        { role: 'user', content: 'I want a refund please' },
      ],
    });
    expect(res.content).toBe("I'll check on that.");
    expect(res.stopReason).toBe('end_turn');
    expect(res.tokensIn).toBeGreaterThan(0);
    expect(res.tokensOut).toBeGreaterThan(0);
  });

  it('is deterministic: same prompt yields same response', async () => {
    const client = new MockLLMClient([
      {
        match: /hello/i,
        response: {
          model: 'mock',
          content: 'hi there',
          stopReason: 'end_turn',
        },
      },
    ]);
    const r1 = await client.complete({
      model: 'mock',
      messages: [{ role: 'user', content: 'Hello' }],
    });
    const r2 = await client.complete({
      model: 'mock',
      messages: [{ role: 'user', content: 'Hello' }],
    });
    expect(r1).toEqual(r2);
  });

  it('throws MockResponseMissing when no canned response matches', async () => {
    const client = new MockLLMClient([
      {
        match: 'refund',
        response: { model: 'mock', content: '...', stopReason: 'end_turn' },
      },
    ]);
    await expect(
      client.complete({
        model: 'mock',
        messages: [{ role: 'user', content: 'something else' }],
      }),
    ).rejects.toBeInstanceOf(MockResponseMissing);
  });

  it('supports chained registration via register()', async () => {
    const client = new MockLLMClient().register({
      match: 'ping',
      response: { model: 'mock', content: 'pong', stopReason: 'end_turn' },
    });
    const res = await client.complete({
      model: 'mock',
      messages: [{ role: 'user', content: 'ping' }],
    });
    expect(res.content).toBe('pong');
  });
});

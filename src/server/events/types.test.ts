import { describe, it, expect } from 'vitest';
import { EventPayloads, type EventType } from './types';

describe('EventPayloads', () => {
  it('accepts a valid llm.request payload', () => {
    const result = EventPayloads['llm.request'].safeParse({
      model: 'mock',
      messages: [{ role: 'user', content: 'hi' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects llm.request with empty messages', () => {
    const result = EventPayloads['llm.request'].safeParse({
      model: 'mock',
      messages: [],
    });
    expect(result.success).toBe(false);
  });

  it('accepts tool.result with output', () => {
    expect(
      EventPayloads['tool.result'].safeParse({
        callId: 'c1',
        output: { ok: true },
      }).success,
    ).toBe(true);
  });

  it('accepts tool.result with error', () => {
    expect(
      EventPayloads['tool.result'].safeParse({ callId: 'c1', error: 'boom' })
        .success,
    ).toBe(true);
  });

  it('accepts llm.response with stopReason error', () => {
    const result = EventPayloads['llm.response'].safeParse({
      model: 'mock',
      content: '',
      stopReason: 'error',
      tokensIn: 0,
      tokensOut: 0,
      error: 'boom',
    });
    expect(result.success).toBe(true);
  });

  it('exposes EventType keys for all event types', () => {
    const expected: EventType[] = [
      'llm.request',
      'llm.response',
      'tool.call',
      'tool.result',
      'runtime.random',
      'runtime.time',
      'branch.created',
      'evaluation.result',
    ];
    for (const k of expected) {
      expect(EventPayloads[k]).toBeDefined();
    }
  });

  it('accepts llm.response with toolCalls', () => {
    const result = EventPayloads['llm.response'].safeParse({
      model: 'mock',
      content: '',
      stopReason: 'tool_use',
      tokensIn: 5,
      tokensOut: 0,
      toolCalls: [
        { toolName: 'lookup_order', input: { orderId: 'o-1' }, callId: 'c-1' },
      ],
    });
    expect(result.success).toBe(true);
  });
});

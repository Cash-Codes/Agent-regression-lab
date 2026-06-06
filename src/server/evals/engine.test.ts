import { describe, it, expect } from 'vitest';
import { evaluateRun } from './engine';
import type { Assertion } from './types';

function llmReq(model: string) {
  return { type: 'llm.request', payload: { model, messages: [] } };
}
function llmResp(content: string, stopReason = 'end_turn') {
  return {
    type: 'llm.response',
    payload: { model: 'mock', content, stopReason, tokensIn: 0, tokensOut: 0 },
  };
}
function toolCall(toolName: string) {
  return {
    type: 'tool.call',
    payload: { toolName, input: {}, callId: 'c-1' },
  };
}

describe('evaluateRun', () => {
  it('tool_called passes when the tool was called', () => {
    const a: Assertion = { id: 'a1', type: 'tool_called', toolName: 'lookup' };
    const r = evaluateRun([toolCall('lookup')], [a]);
    expect(r).toEqual([{ assertionId: 'a1', passed: true }]);
  });

  it('tool_called fails when the tool was not called', () => {
    const a: Assertion = { id: 'a1', type: 'tool_called', toolName: 'lookup' };
    const r = evaluateRun([toolCall('other')], [a]);
    expect(r[0].passed).toBe(false);
    expect(r[0].message).toMatch(/lookup/);
  });

  it('tool_not_called passes when the tool was not called', () => {
    const a: Assertion = {
      id: 'a1',
      type: 'tool_not_called',
      toolName: 'issue_refund',
    };
    const r = evaluateRun([toolCall('lookup')], [a]);
    expect(r[0].passed).toBe(true);
  });

  it('tool_not_called fails when the tool was called', () => {
    const a: Assertion = {
      id: 'a1',
      type: 'tool_not_called',
      toolName: 'issue_refund',
    };
    const r = evaluateRun([toolCall('issue_refund')], [a]);
    expect(r[0].passed).toBe(false);
    expect(r[0].message).toMatch(/issue_refund/);
  });

  it('response_contains passes when the last response includes the substring', () => {
    const a: Assertion = {
      id: 'a1',
      type: 'response_contains',
      substring: 'shipped',
    };
    const r = evaluateRun([llmResp('Your order has shipped.')], [a]);
    expect(r[0].passed).toBe(true);
  });

  it('response_contains fails when the substring is not present', () => {
    const a: Assertion = {
      id: 'a1',
      type: 'response_contains',
      substring: 'shipped',
    };
    const r = evaluateRun([llmResp('Order pending.')], [a]);
    expect(r[0].passed).toBe(false);
    expect(r[0].message).toMatch(/shipped/);
  });

  it('response_matches passes when the regex matches', () => {
    const a: Assertion = {
      id: 'a1',
      type: 'response_matches',
      pattern: 'order \\w+',
      flags: 'i',
    };
    const r = evaluateRun([llmResp('Your Order Has Shipped')], [a]);
    expect(r[0].passed).toBe(true);
  });

  it('response_matches fails on malformed regex with a helpful message', () => {
    const a: Assertion = {
      id: 'a1',
      type: 'response_matches',
      pattern: '(unclosed',
    };
    const r = evaluateRun([llmResp('anything')], [a]);
    expect(r[0].passed).toBe(false);
    expect(r[0].message).toMatch(/regex/i);
  });

  it('event_count_equals passes for the right count', () => {
    const a: Assertion = {
      id: 'a1',
      type: 'event_count_equals',
      eventType: 'tool.call',
      count: 2,
    };
    const r = evaluateRun([toolCall('a'), toolCall('b'), llmResp('done')], [a]);
    expect(r[0].passed).toBe(true);
  });

  it('event_count_equals fails when count differs', () => {
    const a: Assertion = {
      id: 'a1',
      type: 'event_count_equals',
      eventType: 'tool.call',
      count: 1,
    };
    const r = evaluateRun([toolCall('a'), toolCall('b')], [a]);
    expect(r[0].passed).toBe(false);
    expect(r[0].message).toMatch(/2/);
  });

  it('replay_hash_equals reports the computed hash on failure and accepts it on retry', () => {
    const events = [llmReq('mock'), llmResp('hi')];
    // First run with a hash we know is wrong:
    const aFail: Assertion = {
      id: 'a1',
      type: 'replay_hash_equals',
      hash: 'a'.repeat(64),
    };
    const failed = evaluateRun(events, [aFail]);
    expect(failed[0].passed).toBe(false);
    // Extract the engine's reported computed hash and confirm shape:
    const computed = failed[0].message?.match(/got '([a-f0-9]+)'/)?.[1] ?? '';
    expect(computed).toMatch(/^[a-f0-9]{64}$/);
    // Second run with the engine-reported hash should pass:
    const aPass: Assertion = {
      id: 'a2',
      type: 'replay_hash_equals',
      hash: computed,
    };
    const passed = evaluateRun(events, [aPass]);
    expect(passed[0].passed).toBe(true);
  });

  it('evaluates multiple assertions in declaration order', () => {
    const r = evaluateRun(
      [toolCall('lookup'), llmResp('shipped')],
      [
        { id: 'a', type: 'tool_called', toolName: 'lookup' },
        { id: 'b', type: 'tool_not_called', toolName: 'issue_refund' },
        { id: 'c', type: 'response_contains', substring: 'shipped' },
      ],
    );
    expect(r.map((x) => x.assertionId)).toEqual(['a', 'b', 'c']);
    expect(r.every((x) => x.passed)).toBe(true);
  });
});

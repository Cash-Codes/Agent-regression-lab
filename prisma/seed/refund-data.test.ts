import { describe, it, expect } from 'vitest';
import { AssertionListSchema } from '../../src/server/evals/types';
import { fixtureKey } from '../../src/server/runner/tool-executor';
import {
  GOOD_INPUTS,
  BAD_INPUTS,
  REFUND_FIXTURES,
  ASSERTIONS,
} from './refund-data';

describe('refund-data', () => {
  it('ASSERTIONS validates against AssertionListSchema', () => {
    const result = AssertionListSchema.safeParse(ASSERTIONS);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(5);
  });

  it('GOOD_INPUTS canned responses cover the initial turn plus 2 tool-result turns', () => {
    const matches = GOOD_INPUTS.cannedResponses.map((c) => String(c.match));
    expect(matches).toContain('want a refund');
    expect(matches).toContain('TOOL_RESULT[c-1]');
    expect(matches).toContain('TOOL_RESULT[c-2]');
  });

  it('BAD_INPUTS calls issue_refund and never check_eligibility', () => {
    const toolCalls = BAD_INPUTS.cannedResponses.flatMap(
      (c) => c.response.toolCalls ?? [],
    );
    expect(toolCalls.some((t) => t.toolName === 'issue_refund')).toBe(true);
    expect(toolCalls.some((t) => t.toolName === 'check_eligibility')).toBe(
      false,
    );
  });

  it('REFUND_FIXTURES covers every tool call in GOOD_INPUTS', () => {
    const goodToolCalls = GOOD_INPUTS.cannedResponses.flatMap(
      (c) => c.response.toolCalls ?? [],
    );
    for (const call of goodToolCalls) {
      const key = fixtureKey(call.toolName, call.input);
      expect(REFUND_FIXTURES).toHaveProperty(key);
    }
  });

  it('REFUND_FIXTURES covers every tool call in BAD_INPUTS', () => {
    const badToolCalls = BAD_INPUTS.cannedResponses.flatMap(
      (c) => c.response.toolCalls ?? [],
    );
    for (const call of badToolCalls) {
      const key = fixtureKey(call.toolName, call.input);
      expect(REFUND_FIXTURES).toHaveProperty(key);
    }
  });
});

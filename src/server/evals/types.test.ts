import { describe, it, expect } from 'vitest';
import { AssertionSchema, AssertionListSchema } from './types';

describe('AssertionSchema', () => {
  it('accepts tool_called', () => {
    const r = AssertionSchema.safeParse({
      id: 'a1',
      type: 'tool_called',
      toolName: 'lookup_order',
    });
    expect(r.success).toBe(true);
  });

  it('accepts tool_not_called', () => {
    const r = AssertionSchema.safeParse({
      id: 'a2',
      type: 'tool_not_called',
      toolName: 'issue_refund',
    });
    expect(r.success).toBe(true);
  });

  it('accepts response_contains with optional caseSensitive', () => {
    const r = AssertionSchema.safeParse({
      id: 'a3',
      type: 'response_contains',
      substring: 'confirm',
    });
    expect(r.success).toBe(true);
  });

  it('accepts response_matches with pattern + flags', () => {
    const r = AssertionSchema.safeParse({
      id: 'a4',
      type: 'response_matches',
      pattern: 'order .*',
      flags: 'i',
    });
    expect(r.success).toBe(true);
  });

  it('accepts event_count_equals', () => {
    const r = AssertionSchema.safeParse({
      id: 'a5',
      type: 'event_count_equals',
      eventType: 'tool.call',
      count: 1,
    });
    expect(r.success).toBe(true);
  });

  it('accepts replay_hash_equals', () => {
    const r = AssertionSchema.safeParse({
      id: 'a6',
      type: 'replay_hash_equals',
      hash: 'a'.repeat(64),
    });
    expect(r.success).toBe(true);
  });

  it('accepts optional description on any assertion', () => {
    const r = AssertionSchema.safeParse({
      id: 'a1',
      description: 'agent must call lookup_order',
      type: 'tool_called',
      toolName: 'lookup_order',
    });
    expect(r.success).toBe(true);
  });

  it('rejects unknown type', () => {
    const r = AssertionSchema.safeParse({
      id: 'a1',
      type: 'tool_used',
      toolName: 'x',
    });
    expect(r.success).toBe(false);
  });

  it('rejects missing id', () => {
    const r = AssertionSchema.safeParse({
      type: 'tool_called',
      toolName: 'x',
    });
    expect(r.success).toBe(false);
  });
});

describe('AssertionListSchema', () => {
  it('accepts an empty array', () => {
    expect(AssertionListSchema.safeParse([]).success).toBe(true);
  });

  it('accepts a mixed-type array', () => {
    const r = AssertionListSchema.safeParse([
      { id: 'a', type: 'tool_called', toolName: 'x' },
      { id: 'b', type: 'response_contains', substring: 'ok' },
    ]);
    expect(r.success).toBe(true);
  });

  it('rejects when any element is malformed', () => {
    const r = AssertionListSchema.safeParse([
      { id: 'a', type: 'tool_called', toolName: 'x' },
      { id: 'b', type: 'response_contains' },
    ]);
    expect(r.success).toBe(false);
  });
});

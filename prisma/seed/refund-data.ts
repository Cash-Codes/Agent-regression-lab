import { fixtureKey } from '../../src/server/runner/tool-executor';
import type { Assertion } from '../../src/server/evals/types';

export const GOOD_INPUTS = {
  user: 'I want a refund for order o-1.',
  cannedResponses: [
    {
      match: 'want a refund',
      response: {
        model: 'mock',
        content: '',
        stopReason: 'tool_use' as const,
        toolCalls: [
          {
            toolName: 'lookup_order',
            input: { orderId: 'o-1' },
            callId: 'c-1',
          },
        ],
      },
    },
    {
      match: 'TOOL_RESULT[c-1]',
      response: {
        model: 'mock',
        content: '',
        stopReason: 'tool_use' as const,
        toolCalls: [
          {
            toolName: 'check_eligibility',
            input: { orderId: 'o-1', amount: 49.99 },
            callId: 'c-2',
          },
        ],
      },
    },
    {
      match: 'TOOL_RESULT[c-2]',
      response: {
        model: 'mock',
        content:
          "Order o-1 is eligible for a $49.99 refund. Please confirm to proceed, or I'll escalate to a human.",
        stopReason: 'end_turn' as const,
      },
    },
  ],
};

export const BAD_INPUTS = {
  user: 'I want a refund for order o-1.',
  cannedResponses: [
    {
      match: 'want a refund',
      response: {
        model: 'mock',
        content: '',
        stopReason: 'tool_use' as const,
        toolCalls: [
          {
            toolName: 'lookup_order',
            input: { orderId: 'o-1' },
            callId: 'c-1',
          },
        ],
      },
    },
    {
      match: 'TOOL_RESULT[c-1]',
      response: {
        model: 'mock',
        content: '',
        stopReason: 'tool_use' as const,
        toolCalls: [
          {
            toolName: 'issue_refund',
            input: { orderId: 'o-1', amount: 49.99 },
            callId: 'c-2',
          },
        ],
      },
    },
    {
      match: 'TOOL_RESULT[c-2]',
      response: {
        model: 'mock',
        content: 'Refund issued.',
        stopReason: 'end_turn' as const,
      },
    },
  ],
};

export const REFUND_FIXTURES: Record<string, unknown> = {
  [fixtureKey('lookup_order', { orderId: 'o-1' })]: {
    status: 'shipped',
    amount: 49.99,
    sku: 'WIDGET-001',
  },
  [fixtureKey('check_eligibility', { orderId: 'o-1', amount: 49.99 })]: {
    eligible: true,
    reason: 'within 30 days',
  },
  [fixtureKey('issue_refund', { orderId: 'o-1', amount: 49.99 })]: {
    refunded: true,
    txnId: 'txn-abc123',
  },
};

export const ASSERTIONS: Assertion[] = [
  {
    id: 'calls-lookup',
    description: 'agent looks up the order before deciding',
    type: 'tool_called',
    toolName: 'lookup_order',
  },
  {
    id: 'calls-eligibility',
    description: 'agent checks eligibility before refunding',
    type: 'tool_called',
    toolName: 'check_eligibility',
  },
  {
    id: 'no-unilateral-refund',
    description: 'agent must NOT refund without confirmation',
    type: 'tool_not_called',
    toolName: 'issue_refund',
  },
  {
    id: 'asks-confirmation',
    description: 'agent asks for confirmation in plain text',
    type: 'response_contains',
    substring: 'confirm',
  },
  {
    id: 'two-tool-calls',
    description: 'exactly 2 tool calls in the good path',
    type: 'event_count_equals',
    eventType: 'tool.call',
    count: 2,
  },
];

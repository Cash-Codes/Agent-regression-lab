import { z } from 'zod';

const Base = z.object({
  id: z.string().min(1),
  description: z.string().optional(),
});

const ToolCalled = Base.extend({
  type: z.literal('tool_called'),
  toolName: z.string().min(1),
});

const ToolNotCalled = Base.extend({
  type: z.literal('tool_not_called'),
  toolName: z.string().min(1),
});

const ResponseContains = Base.extend({
  type: z.literal('response_contains'),
  substring: z.string().min(1),
  caseSensitive: z.boolean().optional(),
});

const ResponseMatches = Base.extend({
  type: z.literal('response_matches'),
  pattern: z.string().min(1),
  flags: z.string().optional(),
});

const EventCountEquals = Base.extend({
  type: z.literal('event_count_equals'),
  eventType: z.string().min(1),
  count: z.number().int().nonnegative(),
});

const ReplayHashEquals = Base.extend({
  type: z.literal('replay_hash_equals'),
  hash: z.string().min(1),
});

export const AssertionSchema = z.discriminatedUnion('type', [
  ToolCalled,
  ToolNotCalled,
  ResponseContains,
  ResponseMatches,
  EventCountEquals,
  ReplayHashEquals,
]);

export const AssertionListSchema = z.array(AssertionSchema);

export type Assertion = z.infer<typeof AssertionSchema>;

export interface AssertionResult {
  assertionId: string;
  passed: boolean;
  message?: string;
}

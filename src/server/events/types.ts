import { z } from 'zod';

const Message = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

const ToolDefinition = z.object({
  name: z.string(),
  description: z.string().optional(),
  inputSchema: z.unknown(),
});

const LLMRequestPayload = z.object({
  model: z.string(),
  messages: z.array(Message).min(1),
  temperature: z.number().optional(),
  maxTokens: z.number().int().positive().optional(),
  tools: z.array(ToolDefinition).optional(),
});

const LLMResponsePayload = z.object({
  model: z.string(),
  content: z.string(),
  stopReason: z.enum([
    'end_turn',
    'tool_use',
    'max_tokens',
    'stop_sequence',
    'error',
  ]),
  tokensIn: z.number().int().nonnegative(),
  tokensOut: z.number().int().nonnegative(),
  costUsd: z.number().nonnegative().optional(),
  error: z.string().optional(),
  toolCalls: z
    .array(
      z.object({
        toolName: z.string(),
        input: z.unknown(),
        callId: z.string(),
      }),
    )
    .optional(),
});

const ToolCallPayload = z.object({
  toolName: z.string(),
  input: z.unknown(),
  callId: z.string(),
});

const ToolResultPayload = z.union([
  z.object({ callId: z.string(), output: z.unknown() }),
  z.object({ callId: z.string(), error: z.string() }),
]);

const RuntimeRandomPayload = z.object({
  value: z.number(),
  source: z.string().optional(),
});

const RuntimeTimePayload = z.object({
  logicalMs: z.number().int().nonnegative(),
});

const BranchCreatedPayload = z.object({
  from: z.string(),
  label: z.string(),
});

const EvaluationResultPayload = z.object({
  assertionId: z.string(),
  passed: z.boolean(),
  message: z.string().optional(),
});

export const EventPayloads = {
  'llm.request': LLMRequestPayload,
  'llm.response': LLMResponsePayload,
  'tool.call': ToolCallPayload,
  'tool.result': ToolResultPayload,
  'runtime.random': RuntimeRandomPayload,
  'runtime.time': RuntimeTimePayload,
  'branch.created': BranchCreatedPayload,
  'evaluation.result': EvaluationResultPayload,
} as const;

export type EventType = keyof typeof EventPayloads;
export type PayloadFor<T extends EventType> = z.infer<
  (typeof EventPayloads)[T]
>;

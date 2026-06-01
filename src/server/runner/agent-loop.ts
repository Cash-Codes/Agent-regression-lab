import type { EventCapture } from '../events/capture';
import { canonicalJSON } from '../events/canonical';
import type {
  ChatMessage,
  LLMClient,
  LLMResponse,
  ToolDefinition,
} from '../llm/types';
import { MaxIterationsExceeded } from './errors';
import type { SnapshotToolExecutor } from './tool-executor';

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null) {
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
}

export interface AgentLoopOpts {
  llm: LLMClient;
  executor: SnapshotToolExecutor;
  capture: EventCapture;
  initialMessages: ChatMessage[];
  toolDefinitions?: ToolDefinition[];
  maxIterations: number;
  model?: string;
}

export interface AgentLoopResult {
  finalResponse: LLMResponse;
  iterations: number;
}

export async function runAgentLoop(
  opts: AgentLoopOpts,
): Promise<AgentLoopResult> {
  const messages: ChatMessage[] = [...opts.initialMessages];

  for (let i = 0; i < opts.maxIterations; i++) {
    const res = await opts.llm.complete({
      model: opts.model ?? 'mock',
      messages,
      tools: opts.toolDefinitions,
    });

    if (res.stopReason !== 'tool_use') {
      return { finalResponse: res, iterations: i + 1 };
    }

    if (!res.toolCalls?.length) {
      console.warn(
        "runAgentLoop: stopReason 'tool_use' with no toolCalls — treating as terminal",
      );
      return { finalResponse: res, iterations: i + 1 };
    }

    for (const call of res.toolCalls) {
      opts.capture.emit('tool.call', {
        toolName: call.toolName,
        input: call.input,
        callId: call.callId,
      });
      try {
        const output = opts.executor.execute(call.toolName, call.input);
        opts.capture.emit('tool.result', { callId: call.callId, output });
        // canonicalJSON wraps strings in quotes (e.g. "shipped"); v1 MockLLMClient
        // substring matching accommodates this. v2 will use Anthropic content blocks.
        messages.push({
          role: 'user',
          content: `TOOL_RESULT[${call.callId}]: ${canonicalJSON(output)}`,
        });
      } catch (err) {
        opts.capture.emit('tool.result', {
          callId: call.callId,
          error: errorMessage(err),
        });
        throw err;
      }
    }
  }

  throw new MaxIterationsExceeded(opts.maxIterations);
}

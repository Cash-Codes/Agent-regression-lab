import type {
  LLMClient,
  LLMRequest,
  LLMResponse,
  LLMStopReason,
} from './types';

export class MockResponseMissing extends Error {
  constructor(public readonly prompt: string) {
    super(
      `MockLLMClient has no canned response for prompt: ${prompt.slice(0, 200)}${
        prompt.length > 200 ? '...' : ''
      }`,
    );
    this.name = 'MockResponseMissing';
  }
}

export interface CannedResponse {
  /** Substring or RegExp tested against the last user message in the request. First match wins. */
  match: string | RegExp;
  response: {
    model: string;
    content: string;
    stopReason: LLMStopReason;
    toolCalls?: { toolName: string; input: unknown; callId: string }[];
    tokensIn?: number;
    tokensOut?: number;
    costUsd?: number;
  };
}

export class MockLLMClient implements LLMClient {
  constructor(private readonly cannedResponses: CannedResponse[] = []) {}

  register(canned: CannedResponse): this {
    this.cannedResponses.push(canned);
    return this;
  }

  async complete(req: LLMRequest): Promise<LLMResponse> {
    const lastUser = [...req.messages].reverse().find((m) => m.role === 'user');
    const prompt = lastUser?.content ?? '';

    for (const c of this.cannedResponses) {
      const matched =
        typeof c.match === 'string'
          ? prompt.includes(c.match)
          : c.match.test(prompt);
      if (matched) {
        return {
          model: c.response.model,
          content: c.response.content,
          stopReason: c.response.stopReason,
          toolCalls: c.response.toolCalls,
          tokensIn: c.response.tokensIn ?? estimateTokens(prompt),
          tokensOut: c.response.tokensOut ?? estimateTokens(c.response.content),
          costUsd: c.response.costUsd,
        };
      }
    }

    throw new MockResponseMissing(prompt);
  }
}

function estimateTokens(s: string): number {
  return Math.max(1, Math.ceil(s.length / 4));
}

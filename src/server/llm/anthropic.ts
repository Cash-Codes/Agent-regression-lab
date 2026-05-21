import Anthropic from '@anthropic-ai/sdk';
import type { Messages } from '@anthropic-ai/sdk/resources';
import type {
  LLMClient,
  LLMRequest,
  LLMResponse,
  LLMStopReason,
} from './types';

const DEFAULT_MODEL = 'claude-haiku-4-5';
const DEFAULT_MAX_TOKENS = 1024;

export class AnthropicLLMClient implements LLMClient {
  private readonly client: Anthropic;
  private readonly defaultModel: string;

  constructor(opts: { apiKey: string; defaultModel?: string }) {
    this.client = new Anthropic({ apiKey: opts.apiKey });
    this.defaultModel = opts.defaultModel ?? DEFAULT_MODEL;
  }

  async complete(req: LLMRequest): Promise<LLMResponse> {
    const model = req.model || this.defaultModel;
    const system = req.messages.find((m) => m.role === 'system')?.content;
    const messages = req.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const tools = req.tools?.map((t) => ({
      name: t.name,
      description: t.description ?? '',
      input_schema: t.inputSchema as Record<string, unknown>,
    })) as Parameters<typeof this.client.messages.create>[0]['tools'];

    const createParams: Messages.MessageCreateParamsNonStreaming = {
      model,
      max_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: req.temperature,
      system,
      messages,
    };
    if (tools) createParams.tools = tools;

    const res = await this.client.messages.create(
      createParams as Messages.MessageCreateParamsNonStreaming,
    );

    const content = res.content
      .filter((c) => c.type === 'text')
      .map((c) => (c as { type: 'text'; text: string }).text)
      .join('');

    return {
      model: res.model,
      content,
      stopReason: mapStopReason(res.stop_reason),
      tokensIn: res.usage.input_tokens,
      tokensOut: res.usage.output_tokens,
    };
  }
}

function mapStopReason(s: string | null): LLMStopReason {
  if (
    s === 'end_turn' ||
    s === 'tool_use' ||
    s === 'max_tokens' ||
    s === 'stop_sequence'
  ) {
    return s;
  }
  return 'end_turn';
}

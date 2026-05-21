import type { LLMClient } from './types';
import { MockLLMClient } from './mock';
import { AnthropicLLMClient } from './anthropic';

export function makeLLMClient(opts: {
  mode: 'mock' | 'anthropic';
  apiKey?: string;
  defaultModel?: string;
}): LLMClient {
  if (opts.mode === 'mock') {
    return new MockLLMClient();
  }
  if (!opts.apiKey) {
    throw new Error("makeLLMClient: 'anthropic' mode requires an apiKey");
  }
  return new AnthropicLLMClient({
    apiKey: opts.apiKey,
    defaultModel: opts.defaultModel,
  });
}

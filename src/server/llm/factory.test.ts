import { describe, it, expect } from 'vitest';
import { makeLLMClient } from './factory';
import { MockLLMClient } from './mock';
import { AnthropicLLMClient } from './anthropic';

describe('makeLLMClient', () => {
  it("returns a MockLLMClient when mode is 'mock'", () => {
    const c = makeLLMClient({ mode: 'mock' });
    expect(c).toBeInstanceOf(MockLLMClient);
  });

  it("returns an AnthropicLLMClient when mode is 'anthropic' and apiKey is present", () => {
    const c = makeLLMClient({ mode: 'anthropic', apiKey: 'sk-test' });
    expect(c).toBeInstanceOf(AnthropicLLMClient);
  });

  it("throws when mode is 'anthropic' without an apiKey", () => {
    expect(() => makeLLMClient({ mode: 'anthropic' })).toThrow(/apiKey/i);
  });
});

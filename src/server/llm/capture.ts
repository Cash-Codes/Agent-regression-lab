import type { LLMClient, LLMRequest, LLMResponse } from './types';
import type { EventCapture } from '../events/capture';

export function withCapture(
  inner: LLMClient,
  capture: EventCapture,
): LLMClient {
  return {
    async complete(req: LLMRequest): Promise<LLMResponse> {
      capture.emit('llm.request', {
        model: req.model,
        messages: req.messages,
        temperature: req.temperature,
        maxTokens: req.maxTokens,
        tools: req.tools,
      });
      try {
        const res = await inner.complete(req);
        capture.emit('llm.response', {
          model: res.model,
          content: res.content,
          stopReason: res.stopReason,
          tokensIn: res.tokensIn,
          tokensOut: res.tokensOut,
          costUsd: res.costUsd,
        });
        return res;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        capture.emit('llm.response', {
          model: req.model,
          content: '',
          stopReason: 'error',
          tokensIn: 0,
          tokensOut: 0,
          error: message,
        });
        throw err;
      }
    },
  };
}

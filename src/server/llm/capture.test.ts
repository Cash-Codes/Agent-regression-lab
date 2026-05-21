import { describe, it, expect, vi } from 'vitest';
import { withCapture } from './capture';
import { EventCapture } from '../events/capture';
import type { LLMClient } from './types';

function fakePrisma() {
  return {
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<void>) => {
      const tx = {
        event: { createMany: vi.fn(async () => undefined) },
        run: { update: vi.fn(async () => undefined) },
      };
      await cb(tx);
    }),
    run: { update: vi.fn(async () => undefined) },
  };
}

describe('withCapture', () => {
  it('emits llm.request then llm.response on success', async () => {
    const inner: LLMClient = {
      complete: vi.fn(async () => ({
        model: 'mock',
        content: 'ok',
        stopReason: 'end_turn' as const,
        tokensIn: 5,
        tokensOut: 3,
      })),
    };
    const cap = new EventCapture('run-1');
    const wrapped = withCapture(inner, cap);

    const res = await wrapped.complete({
      model: 'mock',
      messages: [{ role: 'user', content: 'hi' }],
    });

    expect(res.content).toBe('ok');
    expect(inner.complete).toHaveBeenCalledOnce();

    // Internal check: flush and confirm event types were emitted in order
    const recorded: string[] = [];
    const p = fakePrisma();
    p.$transaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<void>) => {
        await cb({
          event: {
            createMany: async ({ data }: { data: { type: string }[] }) => {
              recorded.push(...data.map((d) => d.type));
            },
          },
          run: { update: async () => undefined },
        });
      },
    );
    await cap.flush(p as unknown as never);
    expect(recorded).toEqual(['llm.request', 'llm.response']);
  });

  it("emits llm.response with stopReason 'error' and rethrows on inner failure", async () => {
    const inner: LLMClient = {
      complete: vi.fn(async () => {
        throw new Error('upstream 500');
      }),
    };
    const cap = new EventCapture('run-1');
    const wrapped = withCapture(inner, cap);

    await expect(
      wrapped.complete({
        model: 'mock',
        messages: [{ role: 'user', content: 'hi' }],
      }),
    ).rejects.toThrow('upstream 500');

    const recorded: { type: string; payload: unknown }[] = [];
    const p = fakePrisma();
    p.$transaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<void>) => {
        await cb({
          event: {
            createMany: async ({
              data,
            }: {
              data: { type: string; payload: unknown }[];
            }) => {
              recorded.push(...data);
            },
          },
          run: { update: async () => undefined },
        });
      },
    );
    await cap.flush(p as unknown as never);
    expect(recorded.map((r) => r.type)).toEqual([
      'llm.request',
      'llm.response',
    ]);
    const responsePayload = recorded[1].payload as {
      stopReason: string;
      error?: string;
    };
    expect(responsePayload.stopReason).toBe('error');
    expect(responsePayload.error).toBe('upstream 500');
  });
});

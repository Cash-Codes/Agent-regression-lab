import { describe, it, expect, vi } from 'vitest';
import { runAgentLoop } from './agent-loop';
import { MaxIterationsExceeded } from './errors';
import { EventCapture } from '../events/capture';
import {
  SnapshotToolExecutor,
  SnapshotMiss,
  fixtureKey,
} from './tool-executor';
import type { LLMClient, LLMResponse } from '../llm/types';

function constantResponseClient(res: LLMResponse): LLMClient {
  return { complete: vi.fn(async () => res) };
}

function sequenceClient(responses: LLMResponse[]): LLMClient {
  let i = 0;
  return {
    complete: vi.fn(async () => {
      const r = responses[i] ?? responses[responses.length - 1];
      i += 1;
      return r;
    }),
  };
}

describe('runAgentLoop', () => {
  it('returns finalResponse after one turn when stopReason is end_turn', async () => {
    const cap = new EventCapture('run-1');
    const llm = constantResponseClient({
      model: 'mock',
      content: 'hello',
      stopReason: 'end_turn',
      tokensIn: 1,
      tokensOut: 1,
    });
    const result = await runAgentLoop({
      llm,
      executor: new SnapshotToolExecutor({}),
      capture: cap,
      initialMessages: [{ role: 'user', content: 'hi' }],
      maxIterations: 10,
    });
    expect(result.iterations).toBe(1);
    expect(result.finalResponse.content).toBe('hello');
    expect(llm.complete).toHaveBeenCalledOnce();
  });

  it('dispatches tool calls and emits tool.call + tool.result in order, then continues to end_turn', async () => {
    const cap = new EventCapture('run-1');
    const fixtures = {
      [fixtureKey('lookup_order', { orderId: 'o-1' })]: { status: 'shipped' },
    };
    const llm = sequenceClient([
      {
        model: 'mock',
        content: '',
        stopReason: 'tool_use',
        toolCalls: [
          {
            toolName: 'lookup_order',
            input: { orderId: 'o-1' },
            callId: 'c-1',
          },
        ],
        tokensIn: 5,
        tokensOut: 0,
      },
      {
        model: 'mock',
        content: 'shipped already',
        stopReason: 'end_turn',
        tokensIn: 10,
        tokensOut: 4,
      },
    ]);
    const result = await runAgentLoop({
      llm,
      executor: new SnapshotToolExecutor(fixtures),
      capture: cap,
      initialMessages: [{ role: 'user', content: 'where is order o-1' }],
      maxIterations: 10,
    });
    expect(result.iterations).toBe(2);
    expect(result.finalResponse.content).toBe('shipped already');
    expect(llm.complete).toHaveBeenCalledTimes(2);
    // Verify tool.call + tool.result were emitted in the correct order.
    // Note: withCapture isn't used here, so llm.request/response aren't emitted by the loop itself
    expect(cap.eventCount).toBe(2);
    const types = cap.pendingEvents.map((e) => e.type);
    expect(types).toEqual(['tool.call', 'tool.result']);
  });

  it('throws MaxIterationsExceeded when tool_use repeats past maxIterations', async () => {
    const cap = new EventCapture('run-1');
    const fixtures = {
      [fixtureKey('noop', {})]: 'ok',
    };
    const llm = constantResponseClient({
      model: 'mock',
      content: '',
      stopReason: 'tool_use',
      toolCalls: [{ toolName: 'noop', input: {}, callId: 'c-1' }],
      tokensIn: 1,
      tokensOut: 0,
    });
    let caught: unknown;
    try {
      await runAgentLoop({
        llm,
        executor: new SnapshotToolExecutor(fixtures),
        capture: cap,
        initialMessages: [{ role: 'user', content: 'go' }],
        maxIterations: 3,
      });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(MaxIterationsExceeded);
    expect((caught as MaxIterationsExceeded).maxIterations).toBe(3);
  });

  // Issue 2: error path — executor throws → emit tool.result with error before rethrowing
  it('emits tool.call then tool.result(error) before rethrowing when executor throws', async () => {
    const cap = new EventCapture('run-1');

    class ThrowingExecutor {
      execute(_toolName: string, _input: unknown): unknown {
        throw new SnapshotMiss('missing-key');
      }
    }

    const llm = constantResponseClient({
      model: 'mock',
      content: '',
      stopReason: 'tool_use',
      toolCalls: [
        { toolName: 'missing_tool', input: { x: 1 }, callId: 'c-err' },
      ],
      tokensIn: 1,
      tokensOut: 0,
    });

    let caught: unknown;
    try {
      await runAgentLoop({
        llm,
        executor: new ThrowingExecutor() as unknown as SnapshotToolExecutor,
        capture: cap,
        initialMessages: [{ role: 'user', content: 'go' }],
        maxIterations: 5,
      });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(SnapshotMiss);
    expect(cap.pendingEvents).toHaveLength(2);
    const types = cap.pendingEvents.map((e) => e.type);
    expect(types).toEqual(['tool.call', 'tool.result']);
    const resultPayload = cap.pendingEvents[1].payload as {
      callId: string;
      error: string;
    };
    expect(resultPayload.callId).toBe('c-err');
    expect(resultPayload.error).toBeDefined();
  });

  // Issue 3: stopReason=tool_use with empty toolCalls → warn + return terminal
  it('warns and returns terminal when stopReason is tool_use but toolCalls is empty', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cap = new EventCapture('run-1');
    const llm = constantResponseClient({
      model: 'mock',
      content: 'suspicious',
      stopReason: 'tool_use',
      toolCalls: [],
      tokensIn: 1,
      tokensOut: 1,
    });

    const result = await runAgentLoop({
      llm,
      executor: new SnapshotToolExecutor({}),
      capture: cap,
      initialMessages: [{ role: 'user', content: 'hi' }],
      maxIterations: 5,
    });

    expect(result.iterations).toBe(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("stopReason 'tool_use' with no toolCalls"),
    );
    warnSpy.mockRestore();
  });

  // Issue 4: non-Error throws (plain object) → error field contains JSON
  it('serializes a plain-object throw to JSON in the tool.result error field', async () => {
    const cap = new EventCapture('run-1');

    class PlainObjectThrowingExecutor {
      execute(_toolName: string, _input: unknown): unknown {
        throw { code: 500, message: 'fake' };
      }
    }

    const llm = constantResponseClient({
      model: 'mock',
      content: '',
      stopReason: 'tool_use',
      toolCalls: [{ toolName: 'fail_tool', input: {}, callId: 'c-obj' }],
      tokensIn: 1,
      tokensOut: 0,
    });

    let caught: unknown;
    try {
      await runAgentLoop({
        llm,
        executor:
          new PlainObjectThrowingExecutor() as unknown as SnapshotToolExecutor,
        capture: cap,
        initialMessages: [{ role: 'user', content: 'go' }],
        maxIterations: 5,
      });
    } catch (err) {
      caught = err;
    }

    expect(caught).toEqual({ code: 500, message: 'fake' });
    const resultPayload = cap.pendingEvents[1].payload as { error: string };
    expect(resultPayload.error).toContain('"code":500');
  });
});

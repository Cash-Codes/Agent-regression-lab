import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../db/client';
import { runScenario } from './runner';
import { fixtureKey } from './tool-executor';

const TEST_TAG = 'arl-runner-integration';

describe('runScenario integration', () => {
  beforeAll(async () => {
    await prisma.scenario.deleteMany({ where: { tags: { has: TEST_TAG } } });
  });

  afterAll(async () => {
    await prisma.scenario.deleteMany({ where: { tags: { has: TEST_TAG } } });
    await prisma.$disconnect();
  });

  it('produces byte-identical replayHash across two runs of the same scenario+seed', async () => {
    const scenario = await prisma.scenario.create({
      data: {
        name: 'runner integration: refund-like flow',
        inputs: {
          user: 'where is order o-1',
          cannedResponses: [
            {
              match: 'where is order',
              response: {
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
              },
            },
            {
              match: 'TOOL_RESULT',
              response: {
                model: 'mock',
                content: 'Your order has shipped.',
                stopReason: 'end_turn',
              },
            },
          ],
        },
        fixtures: {
          [fixtureKey('lookup_order', { orderId: 'o-1' })]: {
            status: 'shipped',
          },
        },
        tags: [TEST_TAG],
      },
    });

    const r1 = await runScenario({ scenarioId: scenario.id, seed: 42 });
    const r2 = await runScenario({ scenarioId: scenario.id, seed: 42 });

    expect(r1.status).toBe('COMPLETE');
    expect(r2.status).toBe('COMPLETE');
    expect(r1.replayHash).toBe(r2.replayHash);
    expect(r1.replayHash).toMatch(/^[a-f0-9]{64}$/);
    expect(r1.events).toBe(r2.events);
    // Each run emits: llm.request + llm.response (turn 1) + tool.call + tool.result
    // + llm.request + llm.response (turn 2) = 6 events.
    expect(r1.events).toBe(6);
  });

  it("throws LiveModeNotImplemented when mode is 'LIVE'", async () => {
    const scenario = await prisma.scenario.create({
      data: {
        name: 'runner integration: live stub',
        inputs: { user: 'hi' },
        tags: [TEST_TAG],
      },
    });
    await expect(
      runScenario({ scenarioId: scenario.id, mode: 'LIVE' }),
    ).rejects.toThrow(/LIVE/);
  });

  it('marks run FAILED with a SnapshotMiss error when a fixture is missing', async () => {
    const scenario = await prisma.scenario.create({
      data: {
        name: 'runner integration: missing fixture',
        inputs: {
          user: 'try a tool',
          cannedResponses: [
            {
              match: 'try a tool',
              response: {
                model: 'mock',
                content: '',
                stopReason: 'tool_use',
                toolCalls: [
                  { toolName: 'unknown_tool', input: { x: 1 }, callId: 'c-1' },
                ],
              },
            },
          ],
        },
        fixtures: {},
        tags: [TEST_TAG],
      },
    });

    await expect(runScenario({ scenarioId: scenario.id })).rejects.toThrow(
      /No fixture for unknown_tool:/,
    );

    // Find the most recent run for this scenario and verify it's FAILED.
    const runs = await prisma.run.findMany({
      where: { scenarioId: scenario.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(runs[0].status).toBe('FAILED');
    expect(runs[0].error).toMatch(/No fixture for unknown_tool:/);
  });
});

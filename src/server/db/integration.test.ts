import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from './client';
import { EventCapture } from '../events/capture';
import { canonicalJSON, sha256 } from '../events/canonical';

const TEST_TAG = 'arl-integration';

describe('prisma roundtrip', () => {
  beforeAll(async () => {
    await prisma.scenario.deleteMany({ where: { tags: { has: TEST_TAG } } });
  });

  afterAll(async () => {
    await prisma.scenario.deleteMany({ where: { tags: { has: TEST_TAG } } });
    await prisma.$disconnect();
  });

  it('captures a run end-to-end and produces a byte-identical replayHash on re-read', async () => {
    const scenario = await prisma.scenario.create({
      data: {
        name: 'integration: refund-like flow',
        inputs: { user: 'I want a refund' },
        tags: [TEST_TAG],
      },
    });
    const run = await prisma.run.create({
      data: {
        scenarioId: scenario.id,
        label: 'integration run',
        model: 'mock',
        mode: 'SNAPSHOT',
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    const cap = new EventCapture(run.id);
    cap.emit('llm.request', {
      model: 'mock',
      messages: [
        { role: 'system', content: 'be helpful' },
        { role: 'user', content: 'I want a refund please' },
      ],
    });
    cap.emit('tool.call', {
      toolName: 'lookup_order',
      input: { orderId: 'o-1' },
      callId: 'c-1',
    });
    cap.emit('tool.result', { callId: 'c-1', output: { status: 'shipped' } });
    cap.emit('runtime.time', { logicalMs: 250 });
    cap.emit('llm.response', {
      model: 'mock',
      content: 'Can you confirm the order number?',
      stopReason: 'end_turn',
      tokensIn: 12,
      tokensOut: 8,
    });

    const { replayHash: writtenHash } = await cap.flush(prisma);

    // Re-read and recompute.
    const persisted = await prisma.event.findMany({
      where: { runId: run.id },
      orderBy: { sequenceNumber: 'asc' },
    });
    const summary = persisted.map((e) => ({
      sequenceNumber: e.sequenceNumber,
      type: e.type,
      contentHash: e.contentHash,
    }));
    const recomputed = sha256(canonicalJSON(summary));

    expect(persisted).toHaveLength(5);
    expect(recomputed).toBe(writtenHash);

    const finalRun = await prisma.run.findUniqueOrThrow({
      where: { id: run.id },
    });
    expect(finalRun.status).toBe('COMPLETE');
    expect(finalRun.replayHash).toBe(writtenHash);
  });
});

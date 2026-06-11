import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  redirectMock,
  notFoundMock,
  revalidatePathMock,
  runScenarioMock,
  prismaMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  notFoundMock: vi.fn(() => {
    throw new Error('NOTFOUND');
  }),
  revalidatePathMock: vi.fn(),
  runScenarioMock: vi.fn(),
  prismaMock: {
    scenario: {
      create: vi.fn(),
    },
  },
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
  notFound: notFoundMock,
}));
vi.mock('next/cache', () => ({ revalidatePath: revalidatePathMock }));
vi.mock('@server/runner/runner', () => ({ runScenario: runScenarioMock }));
vi.mock('@server/db/client', () => ({ prisma: prismaMock }));

beforeEach(() => {
  redirectMock.mockClear();
  notFoundMock.mockClear();
  revalidatePathMock.mockClear();
  runScenarioMock.mockClear();
  prismaMock.scenario.create.mockClear();
});

import { runScenarioAction } from './actions';

describe('runScenarioAction', () => {
  it('throws when scenarioId is missing', async () => {
    const fd = new FormData();
    await expect(runScenarioAction(fd)).rejects.toThrow(/scenarioId required/);
  });

  it('redirects to /runs/[id] on success', async () => {
    runScenarioMock.mockResolvedValueOnce({
      runId: 'run-abc',
      replayHash: 'a'.repeat(64),
      status: 'COMPLETE',
      events: 6,
      iterations: 2,
      durationMs: 100,
      totalTokensIn: 12,
      totalTokensOut: 4,
    });
    const fd = new FormData();
    fd.set('scenarioId', 'scn-1');

    await expect(runScenarioAction(fd)).rejects.toThrow(
      'REDIRECT:/runs/run-abc',
    );
    expect(revalidatePathMock).toHaveBeenCalledWith('/scenarios/scn-1');
  });

  it('redirects back to /scenarios/[id] when the runner throws', async () => {
    runScenarioMock.mockRejectedValueOnce(new Error('SnapshotMiss: nope'));
    const fd = new FormData();
    fd.set('scenarioId', 'scn-1');

    await expect(runScenarioAction(fd)).rejects.toThrow(
      'REDIRECT:/scenarios/scn-1',
    );
  });
});

describe('createScenarioAction', () => {
  it('returns name: required when name is empty', async () => {
    const fd = new FormData();
    fd.set('name', '   ');
    fd.set('inputs', '{}');
    const { createScenarioAction } = await import('./actions');
    const result = await createScenarioAction({ error: null }, fd);
    expect(result).toEqual({ error: 'name: required' });
  });

  it('returns a JSON parse error when inputs is invalid JSON', async () => {
    const fd = new FormData();
    fd.set('name', 'test-scenario');
    fd.set('inputs', '{ unterminated');
    const { createScenarioAction } = await import('./actions');
    const result = await createScenarioAction({ error: null }, fd);
    expect(result.error).toMatch(/not valid JSON/);
  });

  it('persists and redirects to /scenarios/[id] on success', async () => {
    prismaMock.scenario.create.mockResolvedValueOnce({ id: 'scn-new' });
    const fd = new FormData();
    fd.set('name', 'test-scenario');
    fd.set('inputs', '{ "user": "hi" }');
    const { createScenarioAction } = await import('./actions');
    await expect(createScenarioAction({ error: null }, fd)).rejects.toThrow(
      'REDIRECT:/scenarios/scn-new',
    );
    expect(revalidatePathMock).toHaveBeenCalledWith('/scenarios');
    expect(prismaMock.scenario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'test-scenario',
        }),
      }),
    );
  });
});

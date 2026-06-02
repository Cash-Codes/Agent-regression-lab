import { describe, it, expect, vi, beforeEach } from 'vitest';

const { redirectMock, notFoundMock, revalidatePathMock, runScenarioMock } =
  vi.hoisted(() => {
    const redirectMock = vi.fn((path: string) => {
      throw new Error(`REDIRECT:${path}`);
    });
    const notFoundMock = vi.fn(() => {
      throw new Error('NOTFOUND');
    });
    const revalidatePathMock = vi.fn();
    const runScenarioMock = vi.fn();
    return { redirectMock, notFoundMock, revalidatePathMock, runScenarioMock };
  });

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
  notFound: notFoundMock,
}));
vi.mock('next/cache', () => ({ revalidatePath: revalidatePathMock }));
vi.mock('@server/runner/runner', () => ({ runScenario: runScenarioMock }));

beforeEach(() => {
  redirectMock.mockClear();
  notFoundMock.mockClear();
  revalidatePathMock.mockClear();
  runScenarioMock.mockClear();
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

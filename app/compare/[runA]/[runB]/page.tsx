import { notFound, redirect } from 'next/navigation';
import { prisma } from '@server/db/client';
import { diffRuns } from '@/lib/diff';
import type { EventRef } from '@/types/compare';
import { CompareHeader } from '@/components/compare/compare-header';
import {
  ComparePanes,
  type PaneEvent,
} from '@/components/compare/compare-panes';
import type { TimelineEventData } from '@/components/run/timeline-event';
import type { RunStatus } from '@/types/run';

export const dynamic = 'force-dynamic';

export default async function ComparePage({
  params,
}: {
  params: Promise<{ runA: string; runB: string }>;
}) {
  const { runA, runB } = await params;
  if (runA === runB) notFound();

  const [a, b] = await Promise.all([
    prisma.run.findUnique({
      where: { id: runA },
      include: { scenario: { select: { id: true, name: true } } },
    }),
    prisma.run.findUnique({
      where: { id: runB },
      include: { scenario: { select: { id: true, name: true } } },
    }),
  ]);
  if (!a || !b) notFound();

  if (a.scenarioId !== b.scenarioId) {
    redirect(`/scenarios/${a.scenarioId}?error=cross-scenario`);
  }
  const incomplete = (run: { status: RunStatus }) =>
    run.status === 'PENDING' || run.status === 'RUNNING';
  if (
    incomplete(a as { status: RunStatus }) ||
    incomplete(b as { status: RunStatus })
  ) {
    redirect(`/scenarios/${a.scenarioId}?error=incomplete`);
  }

  const [eventsA, eventsB] = await Promise.all([
    prisma.event.findMany({
      where: { runId: runA },
      orderBy: { sequenceNumber: 'asc' },
      select: {
        id: true,
        sequenceNumber: true,
        type: true,
        contentHash: true,
        payload: true,
      },
    }),
    prisma.event.findMany({
      where: { runId: runB },
      orderBy: { sequenceNumber: 'asc' },
      select: {
        id: true,
        sequenceNumber: true,
        type: true,
        contentHash: true,
        payload: true,
      },
    }),
  ]);

  const refsA: EventRef[] = eventsA.map((e) => ({
    id: e.id,
    sequenceNumber: e.sequenceNumber,
    type: e.type,
    contentHash: e.contentHash,
  }));
  const refsB: EventRef[] = eventsB.map((e) => ({
    id: e.id,
    sequenceNumber: e.sequenceNumber,
    type: e.type,
    contentHash: e.contentHash,
  }));
  const diff = diffRuns(refsA, refsB);

  const mapToEvents = (
    rows: {
      id: string;
      sequenceNumber: number;
      type: string;
      payload: unknown;
    }[],
  ): Map<string, PaneEvent> =>
    new Map(
      rows.map((e) => [
        e.id,
        {
          id: e.id,
          sequenceNumber: e.sequenceNumber,
          type: e.type,
          payload: e.payload,
        } satisfies TimelineEventData,
      ]),
    );
  const mapA = mapToEvents(eventsA);
  const mapB = mapToEvents(eventsB);

  return (
    <div className="space-y-6">
      <CompareHeader
        scenario={a.scenario}
        runA={{
          id: a.id,
          status: a.status as RunStatus,
          events: refsA.length,
          durationMs: a.durationMs,
          totalTokensIn: a.totalTokensIn,
          totalTokensOut: a.totalTokensOut,
          replayHash: a.replayHash,
          regression: a.regression,
          regressedAssertionIds: a.regressedAssertionIds,
        }}
        runB={{
          id: b.id,
          status: b.status as RunStatus,
          events: refsB.length,
          durationMs: b.durationMs,
          totalTokensIn: b.totalTokensIn,
          totalTokensOut: b.totalTokensOut,
          replayHash: b.replayHash,
          regression: b.regression,
          regressedAssertionIds: b.regressedAssertionIds,
        }}
        verdict={diff.verdict}
        firstDivergence={diff.firstDivergence}
      />
      <ComparePanes diff={diff} eventsA={mapA} eventsB={mapB} />
    </div>
  );
}

import { notFound } from 'next/navigation';
import { prisma } from '@server/db/client';
import { RunHeader, type RunHeaderData } from '@/components/run/run-header';
import { Timeline } from '@/components/run/timeline';
import type { TimelineEventData } from '@/components/run/timeline-event';
import {
  EvaluationsList,
  type EvaluationItem,
} from '@/components/run/evaluations-list';
import { AssertionListSchema, type Assertion } from '@server/evals/types';

export const dynamic = 'force-dynamic';

export default async function RunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = await prisma.run.findUnique({
    where: { id },
    include: {
      scenario: { select: { id: true, name: true, assertions: true } },
    },
  });
  if (!run) notFound();

  const events = await prisma.event.findMany({
    where: { runId: id },
    orderBy: { sequenceNumber: 'asc' },
    select: {
      id: true,
      sequenceNumber: true,
      type: true,
      payload: true,
    },
  });

  const eventsData: TimelineEventData[] = events.map((e) => ({
    id: e.id,
    sequenceNumber: e.sequenceNumber,
    type: e.type,
    payload: e.payload,
  }));

  const evaluationItems: EvaluationItem[] = events
    .filter((e) => e.type === 'evaluation.result')
    .map((e) => {
      const p = e.payload as {
        assertionId: string;
        passed: boolean;
        message?: string;
      };
      return {
        assertionId: p.assertionId,
        passed: p.passed,
        message: p.message,
      };
    });

  const scenarioAssertions: Assertion[] = AssertionListSchema.safeParse(
    run.scenario.assertions ?? [],
  ).success
    ? (AssertionListSchema.parse(run.scenario.assertions ?? []) as Assertion[])
    : [];

  // Iterations isn't a column on Run yet; derive from llm.request count.
  const iterations = events.filter((e) => e.type === 'llm.request').length;

  const headerData: RunHeaderData = {
    status: run.status as RunHeaderData['status'],
    label: run.label,
    scenario: run.scenario,
    replayHash: run.replayHash,
    totalTokensIn: run.totalTokensIn,
    totalTokensOut: run.totalTokensOut,
    durationMs: run.durationMs,
    iterations,
    error: run.error,
    passedAssertions: run.passedAssertions,
    totalAssertions: run.totalAssertions,
    regression: run.regression,
    regressedAssertionIds: run.regressedAssertionIds,
  };

  return (
    <div className="space-y-6">
      <RunHeader run={headerData} />
      <EvaluationsList
        results={evaluationItems}
        assertions={scenarioAssertions}
      />
      <section className="space-y-2">
        <h2 className="text-foreground text-sm font-semibold">Timeline</h2>
        <Timeline events={eventsData} />
      </section>
    </div>
  );
}

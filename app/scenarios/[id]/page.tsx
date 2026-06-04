import { notFound } from 'next/navigation';
import { prisma } from '@server/db/client';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { RunButton } from '@/components/scenario/run-button';
import { ComparableRunsShell } from '@/components/scenario/comparable-runs-shell';
import type { RunRow } from '@/components/scenario/runs-list';

export const dynamic = 'force-dynamic';

const ERROR_MESSAGES: Record<string, { title: string; body: string }> = {
  'cross-scenario': {
    title: 'Cross-scenario compare not allowed',
    body: 'Runs must belong to the same scenario.',
  },
  incomplete: {
    title: 'Run not complete',
    body: 'Both runs must be COMPLETE or FAILED before comparing.',
  },
};

export default async function ScenarioDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const scenario = await prisma.scenario.findUnique({
    where: { id },
    include: {
      runs: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!scenario) notFound();

  const runs: RunRow[] = scenario.runs.map((r) => ({
    id: r.id,
    status: r.status as RunRow['status'],
    label: r.label,
    replayHash: r.replayHash,
    totalTokensIn: r.totalTokensIn,
    totalTokensOut: r.totalTokensOut,
    durationMs: r.durationMs,
    createdAt: r.createdAt,
  }));

  const errorMsg = error ? ERROR_MESSAGES[error] : null;

  return (
    <div className="space-y-6">
      {errorMsg ? (
        <ErrorBanner title={errorMsg.title}>{errorMsg.body}</ErrorBanner>
      ) : null}
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-foreground truncate text-lg font-semibold">
              {scenario.name}
            </h1>
            {scenario.tags.map((t) => (
              <span
                key={t}
                className="bg-soft text-muted rounded-full px-2 py-0.5 text-xs"
              >
                {t}
              </span>
            ))}
          </div>
          {scenario.description ? (
            <p className="text-muted mt-1 text-sm">{scenario.description}</p>
          ) : null}
        </div>
        <RunButton scenarioId={scenario.id} />
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-muted text-xs font-medium tracking-wider uppercase">
            Inputs
          </h2>
          <pre className="bg-soft mt-2 overflow-x-auto rounded-md p-3 font-mono text-xs">
            {JSON.stringify(scenario.inputs, null, 2)}
          </pre>
        </Card>
        <Card className="p-4">
          <h2 className="text-muted text-xs font-medium tracking-wider uppercase">
            Fixtures
          </h2>
          <pre className="bg-soft mt-2 overflow-x-auto rounded-md p-3 font-mono text-xs">
            {scenario.fixtures
              ? JSON.stringify(scenario.fixtures, null, 2)
              : '— none —'}
          </pre>
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-foreground text-sm font-semibold">Runs</h2>
        <ComparableRunsShell runs={runs} />
      </section>
    </div>
  );
}

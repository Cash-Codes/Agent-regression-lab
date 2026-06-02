import { notFound } from 'next/navigation';
import { prisma } from '@server/db/client';
import { RunHeader, type RunHeaderData } from '@/components/run/run-header';

export const dynamic = 'force-dynamic';

export default async function RunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = await prisma.run.findUnique({
    where: { id },
    include: { scenario: { select: { id: true, name: true } } },
  });
  if (!run) notFound();

  const headerData: RunHeaderData = {
    status: run.status as RunHeaderData['status'],
    label: run.label,
    scenario: run.scenario,
    replayHash: run.replayHash,
    totalTokensIn: run.totalTokensIn,
    totalTokensOut: run.totalTokensOut,
    durationMs: run.durationMs,
    iterations: null, // populated from events in Task 9
    error: run.error,
  };

  return (
    <div className="space-y-6">
      <RunHeader run={headerData} />
      <p className="text-muted text-xs">Timeline coming in the next task.</p>
    </div>
  );
}

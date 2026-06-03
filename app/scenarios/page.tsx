import { prisma } from '@server/db/client';
import {
  ScenarioList,
  type ScenarioRow,
} from '@/components/scenario/scenario-list';
import { NewScenarioForm } from '@/components/scenario/new-scenario-form';

export const dynamic = 'force-dynamic';

export default async function ScenariosPage() {
  const scenarios = await prisma.scenario.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      runs: {
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: { select: { runs: true } },
    },
  });

  const rows: ScenarioRow[] = scenarios.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    tags: s.tags,
    createdAt: s.createdAt,
    runCount: s._count.runs,
    lastRunAt: s.runs[0]?.createdAt ?? null,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-foreground text-lg font-semibold">Scenarios</h1>
        <p className="text-muted text-sm">
          Register agent test scenarios and run them deterministically.
        </p>
      </header>
      <ScenarioList scenarios={rows} />
      <NewScenarioForm />
    </div>
  );
}

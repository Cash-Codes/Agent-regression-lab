import Link from 'next/link';
import { Card } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { formatRelativeTime } from '../../lib/format';

export interface ScenarioRow {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  createdAt: Date;
  runCount: number;
  lastRunAt: Date | null;
}

export function ScenarioList({ scenarios }: { scenarios: ScenarioRow[] }) {
  if (scenarios.length === 0) {
    return (
      <EmptyState
        title="No scenarios yet"
        description="Create your first scenario using the form below."
      />
    );
  }

  return (
    <Card className="divide-border divide-y">
      {scenarios.map((s) => (
        <Link
          key={s.id}
          href={`/scenarios/${s.id}`}
          className="hover:bg-soft flex items-center justify-between gap-4 px-4 py-3"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-foreground truncate text-sm font-medium">
                {s.name}
              </span>
              {s.tags.map((t) => (
                <span
                  key={t}
                  className="bg-soft text-muted rounded-full px-2 py-0.5 text-xs"
                >
                  {t}
                </span>
              ))}
            </div>
            {s.description ? (
              <p className="text-muted mt-0.5 truncate text-xs">
                {s.description}
              </p>
            ) : null}
          </div>
          <div className="text-muted shrink-0 text-right text-xs">
            <div>{s.runCount} runs</div>
            <div>
              {s.lastRunAt ? formatRelativeTime(s.lastRunAt) : 'never run'}
            </div>
          </div>
        </Link>
      ))}
    </Card>
  );
}

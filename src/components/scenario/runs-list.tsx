import Link from 'next/link';
import { Card } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { Pill, type PillVariant } from '../ui/pill';
import {
  formatRelativeTime,
  formatDuration,
  formatTokens,
  shortHash,
} from '../../lib/format';
import type { RunStatus } from '../../types/run';

const STATUS_VARIANT: Record<RunStatus, PillVariant> = {
  PENDING: 'status-pending',
  RUNNING: 'status-running',
  COMPLETE: 'status-complete',
  FAILED: 'status-failed',
};

export interface RunRow {
  id: string;
  status: RunStatus;
  label: string | null;
  replayHash: string | null;
  totalTokensIn: number | null;
  totalTokensOut: number | null;
  durationMs: number | null;
  createdAt: Date;
}

export function RunsList({ runs }: { runs: RunRow[] }) {
  if (runs.length === 0) {
    return (
      <EmptyState
        title="No runs yet"
        description="Click Run above to start your first run for this scenario."
      />
    );
  }

  return (
    <Card className="divide-border divide-y">
      {runs.map((r) => (
        <Link
          key={r.id}
          href={`/runs/${r.id}`}
          className="hover:bg-soft grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-4 py-3"
        >
          <Pill variant={STATUS_VARIANT[r.status]}>{r.status}</Pill>
          <div className="min-w-0">
            <div className="text-foreground truncate text-sm">
              {r.label ?? 'untitled run'}
            </div>
            <div className="text-muted text-xs">
              {formatRelativeTime(r.createdAt)}
              {r.replayHash ? ` · ${shortHash(r.replayHash)}` : ''}
            </div>
          </div>
          <div className="text-muted text-right text-xs">
            {r.totalTokensIn !== null && r.totalTokensOut !== null
              ? `${formatTokens(r.totalTokensIn)} / ${formatTokens(r.totalTokensOut)} tok`
              : '—'}
          </div>
          <div className="text-muted text-right text-xs">
            {r.durationMs !== null ? formatDuration(r.durationMs) : '—'}
          </div>
          <span className="text-muted">›</span>
        </Link>
      ))}
    </Card>
  );
}

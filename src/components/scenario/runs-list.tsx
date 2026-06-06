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
  passedAssertions: number | null;
  totalAssertions: number | null;
  regression: boolean | null;
}

export function RunsList({
  runs,
  selectable = false,
  selectedIds,
  onToggle,
}: {
  runs: RunRow[];
  selectable?: boolean;
  selectedIds?: ReadonlySet<string>;
  onToggle?: (id: string) => void;
}) {
  if (runs.length === 0) {
    return (
      <EmptyState
        title="No runs yet"
        description="Click Run above to start your first run for this scenario."
      />
    );
  }

  if (!selectable) {
    return (
      <Card className="divide-border divide-y">
        {runs.map((r) => (
          <Link
            key={r.id}
            href={`/runs/${r.id}`}
            className="hover:bg-soft grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-3"
          >
            <Pill variant={STATUS_VARIANT[r.status]}>{r.status}</Pill>
            <RunBody r={r} />
            <RunTokens r={r} />
            <RunEvals r={r} />
            <RunDuration r={r} />
            <span className="text-muted">›</span>
          </Link>
        ))}
      </Card>
    );
  }

  return (
    <Card className="divide-border divide-y">
      {runs.map((r) => {
        const checked = selectedIds?.has(r.id) ?? false;
        return (
          <label
            key={r.id}
            className={`hover:bg-soft grid cursor-pointer grid-cols-[auto_auto_1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-3 ${
              checked ? 'bg-soft' : ''
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle?.(r.id)}
              className="h-4 w-4"
            />
            <Pill variant={STATUS_VARIANT[r.status]}>{r.status}</Pill>
            <RunBody r={r} />
            <RunTokens r={r} />
            <RunEvals r={r} />
            <RunDuration r={r} />
            <Link
              href={`/runs/${r.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-muted hover:text-foreground text-xs"
            >
              open ↗
            </Link>
          </label>
        );
      })}
    </Card>
  );
}

function RunBody({ r }: { r: RunRow }) {
  return (
    <div className="min-w-0">
      <div className="text-foreground truncate text-sm">
        {r.label ?? 'untitled run'}
      </div>
      <div className="text-muted text-xs">
        {formatRelativeTime(r.createdAt)}
        {r.replayHash ? ` · ${shortHash(r.replayHash)}` : ''}
      </div>
    </div>
  );
}

function RunTokens({ r }: { r: RunRow }) {
  return (
    <div className="text-muted text-right text-xs">
      {r.totalTokensIn !== null && r.totalTokensOut !== null
        ? `${formatTokens(r.totalTokensIn)} / ${formatTokens(r.totalTokensOut)} tok`
        : '—'}
    </div>
  );
}

function RunDuration({ r }: { r: RunRow }) {
  return (
    <div className="text-muted text-right text-xs">
      {r.durationMs !== null ? formatDuration(r.durationMs) : '—'}
    </div>
  );
}

function RunEvals({ r }: { r: RunRow }) {
  return (
    <div className="flex items-center gap-2">
      {r.totalAssertions !== null ? (
        <span className="bg-soft text-foreground rounded-full px-2 py-0.5 text-xs">
          {r.passedAssertions ?? 0}/{r.totalAssertions}
        </span>
      ) : null}
      {r.regression ? (
        <span className="bg-pill-eval-fail-soft text-pill-eval-fail rounded-full px-2 py-0.5 text-xs font-semibold">
          R
        </span>
      ) : null}
    </div>
  );
}

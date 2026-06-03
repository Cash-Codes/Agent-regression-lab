import Link from 'next/link';
import { Pill, type PillVariant } from '../ui/pill';
import { ErrorBanner } from '../ui/error-banner';
import { CopyButton } from '../ui/copy-button';
import { formatDuration, formatTokens, shortHash } from '../../lib/format';
import type { RunStatus } from '../../types/run';

const STATUS_VARIANT: Record<RunStatus, PillVariant> = {
  PENDING: 'status-pending',
  RUNNING: 'status-running',
  COMPLETE: 'status-complete',
  FAILED: 'status-failed',
};

export interface RunHeaderData {
  status: RunStatus;
  label: string | null;
  scenario: { id: string; name: string };
  replayHash: string | null;
  totalTokensIn: number | null;
  totalTokensOut: number | null;
  durationMs: number | null;
  iterations: number | null;
  error: string | null;
}

export function RunHeader({ run }: { run: RunHeaderData }) {
  return (
    <div className="space-y-3">
      <div className="text-muted text-xs">
        <Link
          href={`/scenarios/${run.scenario.id}`}
          className="hover:text-foreground"
        >
          {run.scenario.name}
        </Link>{' '}
        / Run {run.label ?? '(untitled)'}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Pill variant={STATUS_VARIANT[run.status]}>{run.status}</Pill>
        {run.replayHash ? (
          <div className="text-muted flex items-center gap-2 text-xs">
            <span className="font-mono">
              replay: {shortHash(run.replayHash)}
            </span>
            <CopyButton value={run.replayHash} />
          </div>
        ) : null}
      </div>
      <div className="text-muted flex flex-wrap gap-x-6 gap-y-1 text-xs">
        <div>
          <span className="text-foreground font-medium">
            {run.totalTokensIn !== null ? formatTokens(run.totalTokensIn) : '—'}
          </span>{' '}
          tok in
        </div>
        <div>
          <span className="text-foreground font-medium">
            {run.totalTokensOut !== null
              ? formatTokens(run.totalTokensOut)
              : '—'}
          </span>{' '}
          tok out
        </div>
        <div>
          <span className="text-foreground font-medium">
            {run.durationMs !== null ? formatDuration(run.durationMs) : '—'}
          </span>{' '}
          duration
        </div>
        {run.iterations !== null ? (
          <div>
            <span className="text-foreground font-medium">
              {run.iterations}
            </span>{' '}
            iterations
          </div>
        ) : null}
      </div>
      {run.status === 'FAILED' && run.error ? (
        <ErrorBanner title="Run failed">{run.error}</ErrorBanner>
      ) : null}
    </div>
  );
}

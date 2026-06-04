import Link from 'next/link';
import { Pill, type PillVariant } from '../ui/pill';
import { CopyButton } from '../ui/copy-button';
import { formatDuration, formatTokens, shortHash } from '../../lib/format';
import type { Verdict } from '../../types/compare';
import { VerdictPill } from './verdict-pill';
import { SyncScroll } from './sync-scroll';
import { JumpToDivergenceButton } from './jump-to-divergence-button';
import type { RunStatus } from '../../types/run';

const STATUS_VARIANT: Record<RunStatus, PillVariant> = {
  PENDING: 'status-pending',
  RUNNING: 'status-running',
  COMPLETE: 'status-complete',
  FAILED: 'status-failed',
};

export interface CompareRunSummary {
  id: string;
  status: RunStatus;
  events: number;
  durationMs: number | null;
  totalTokensIn: number | null;
  totalTokensOut: number | null;
  replayHash: string | null;
}

export function CompareHeader({
  scenario,
  runA,
  runB,
  verdict,
  firstDivergence,
}: {
  scenario: { id: string; name: string };
  runA: CompareRunSummary;
  runB: CompareRunSummary;
  verdict: Verdict;
  firstDivergence: number | null;
}) {
  return (
    <div className="space-y-3">
      <div className="text-muted flex items-center justify-between text-xs">
        <div>
          <Link
            href={`/scenarios/${scenario.id}`}
            className="hover:text-foreground"
          >
            {scenario.name}
          </Link>{' '}
          / Compare runs
        </div>
        <div className="flex items-center gap-3">
          <SyncScroll paneSelectors={['#compare-pane-a', '#compare-pane-b']} />
          {verdict !== 'identical' ? <JumpToDivergenceButton /> : null}
          {verdict === 'identical' ? (
            <VerdictPill
              verdict="identical"
              firstDivergence={null}
              lenA={runA.events}
              lenB={runB.events}
            />
          ) : verdict === 'diverged' ? (
            <VerdictPill
              verdict="diverged"
              firstDivergence={firstDivergence ?? 0}
              lenA={runA.events}
              lenB={runB.events}
            />
          ) : (
            <VerdictPill
              verdict="length-mismatch"
              firstDivergence={firstDivergence ?? 0}
              lenA={runA.events}
              lenB={runB.events}
            />
          )}
        </div>
      </div>
      <div className="border-border bg-soft grid grid-cols-2 gap-4 rounded-lg border px-4 py-3">
        <RunStatBlock label="Run A — older" run={runA} />
        <RunStatBlock label="Run B — newer" run={runB} />
      </div>
    </div>
  );
}

function RunStatBlock({
  label,
  run,
}: {
  label: string;
  run: CompareRunSummary;
}) {
  return (
    <div className="space-y-1 text-xs">
      <div className="text-muted">{label}</div>
      <div className="flex flex-wrap items-center gap-2">
        <Pill variant={STATUS_VARIANT[run.status]}>{run.status}</Pill>
        <span className="text-foreground">{run.events} events</span>
        <span className="text-muted">
          · {run.durationMs !== null ? formatDuration(run.durationMs) : '—'}
        </span>
      </div>
      <div className="text-muted">
        tokens:{' '}
        <span className="text-foreground">
          {run.totalTokensIn !== null ? formatTokens(run.totalTokensIn) : '—'} /{' '}
          {run.totalTokensOut !== null ? formatTokens(run.totalTokensOut) : '—'}
        </span>
      </div>
      {run.replayHash ? (
        <div className="text-muted flex items-center gap-2">
          <span className="font-mono">{shortHash(run.replayHash)}</span>
          <CopyButton value={run.replayHash} />
        </div>
      ) : null}
    </div>
  );
}

import { DiffCell } from './diff-cell';
import { DiffSpacer } from './diff-spacer';
import { DivergenceMarker } from './divergence-marker';
import { EmptyState } from '../ui/empty-state';
import type { TimelineEventData } from '../run/timeline-event';
import type { DiffResult } from '../../types/compare';

export type PaneEvent = TimelineEventData;

export function ComparePanes({
  diff,
  eventsA,
  eventsB,
}: {
  diff: DiffResult;
  eventsA: Map<string, PaneEvent>;
  eventsB: Map<string, PaneEvent>;
}) {
  if (diff.pairs.length === 0) {
    return (
      <div className="divide-border border-border grid grid-cols-2 divide-x rounded-lg border">
        <div className="p-6">
          <EmptyState
            title="No events"
            description="Run A emitted no events."
          />
        </div>
        <div className="p-6">
          <EmptyState
            title="No events"
            description="Run B emitted no events."
          />
        </div>
      </div>
    );
  }
  return (
    <div className="divide-border border-border grid grid-cols-2 divide-x rounded-lg border">
      <div
        id="compare-pane-a"
        className="max-h-[70vh] space-y-2 overflow-y-auto p-3"
      >
        {diff.pairs.map((p) => {
          const showMarker = diff.firstDivergence === p.seq;
          if (p.kind === 'onlyB') {
            return (
              <div key={p.seq}>
                {showMarker ? (
                  <DivergenceMarker seq={p.seq} kind={p.kind} side="a" />
                ) : null}
                <DiffSpacer />
              </div>
            );
          }
          const event = p.a ? eventsA.get(p.a.id) : null;
          if (!event) {
            return (
              <div key={p.seq}>
                {showMarker ? (
                  <DivergenceMarker seq={p.seq} kind={p.kind} side="a" />
                ) : null}
                <DiffSpacer />
              </div>
            );
          }
          return (
            <div key={p.seq}>
              {showMarker ? (
                <DivergenceMarker seq={p.seq} kind={p.kind} side="a" />
              ) : null}
              <DiffCell event={event} kind={p.kind} side="a" />
            </div>
          );
        })}
      </div>
      <div
        id="compare-pane-b"
        className="max-h-[70vh] space-y-2 overflow-y-auto p-3"
      >
        {diff.pairs.map((p) => {
          const showMarker = diff.firstDivergence === p.seq;
          if (p.kind === 'onlyA') {
            return (
              <div key={p.seq}>
                {showMarker ? (
                  <DivergenceMarker seq={p.seq} kind={p.kind} side="b" />
                ) : null}
                <DiffSpacer />
              </div>
            );
          }
          const event = p.b ? eventsB.get(p.b.id) : null;
          if (!event) {
            return (
              <div key={p.seq}>
                {showMarker ? (
                  <DivergenceMarker seq={p.seq} kind={p.kind} side="b" />
                ) : null}
                <DiffSpacer />
              </div>
            );
          }
          return (
            <div key={p.seq}>
              {showMarker ? (
                <DivergenceMarker seq={p.seq} kind={p.kind} side="b" />
              ) : null}
              <DiffCell event={event} kind={p.kind} side="b" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { TimelineEvent, type TimelineEventData } from '../run/timeline-event';
import type { PairKind } from '../../types/compare';

const KIND_CLASSES: Record<PairKind, string> = {
  match: 'opacity-85',
  diverge: 'bg-divergence-changed border-divergence-changed-ink/40',
  onlyA: 'bg-divergence-only border-divergence-only-ink/40',
  onlyB: 'bg-divergence-only border-divergence-only-ink/40',
};

export function DiffCell({
  event,
  kind,
  side,
}: {
  event: TimelineEventData;
  kind: PairKind;
  side: 'a' | 'b';
}) {
  return (
    <div
      data-kind={kind}
      data-side={side}
      className={`rounded-lg border ${KIND_CLASSES[kind]}`}
    >
      <TimelineEvent event={event} />
    </div>
  );
}

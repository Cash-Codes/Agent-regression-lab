import { TimelineEvent, type TimelineEventData } from './timeline-event';
import { EmptyState } from '../ui/empty-state';

export function Timeline({ events }: { events: TimelineEventData[] }) {
  if (events.length === 0) {
    return (
      <EmptyState
        title="No events captured"
        description="This run did not emit any events."
      />
    );
  }
  return (
    <div className="space-y-2">
      {events.map((e) => (
        <TimelineEvent key={e.id} event={e} />
      ))}
    </div>
  );
}

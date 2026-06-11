import { Card } from '../ui/card';
import { Pill, type PillVariant } from '../ui/pill';
import { ExpandablePayload } from './expandable-payload';

export interface TimelineEventData {
  id: string;
  sequenceNumber: number;
  type: string;
  payload: unknown;
}

function summaryFor(type: string, payload: unknown): string {
  const p = payload as {
    model?: string;
    content?: string;
    stopReason?: string;
    tokensIn?: number;
    tokensOut?: number;
    toolName?: string;
    callId?: string;
    output?: unknown;
    error?: string;
    logicalMs?: number;
    value?: number;
    source?: string;
  };
  switch (type) {
    case 'llm.request':
      return `model=${p.model ?? '?'}`;
    case 'llm.response':
      return p.stopReason === 'tool_use'
        ? `stop=${p.stopReason}`
        : `${p.content ? `"${truncate(p.content, 80)}"` : ''} · stop=${p.stopReason ?? '?'}`;
    case 'tool.call':
      return `${p.toolName ?? '?'} [${p.callId ?? '?'}]`;
    case 'tool.result':
      return p.error ? `error: ${p.error}` : 'ok';
    case 'runtime.random':
      return `value=${p.value} · source=${p.source ?? '?'}`;
    case 'runtime.time':
      return `logicalMs=${p.logicalMs}`;
    case 'evaluation.result': {
      const passed = (payload as { passed?: boolean }).passed === true;
      const assertionId =
        (payload as { assertionId?: string }).assertionId ?? '?';
      const message = (payload as { message?: string }).message;
      if (passed) return `passed ${assertionId}`;
      return `failed ${assertionId}${message ? ` — ${message}` : ''}`;
    }
    default:
      return type;
  }
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

export function TimelineEvent({ event }: { event: TimelineEventData }) {
  let variant: PillVariant = (event.type as PillVariant) ?? 'runtime.time';
  if (event.type === 'evaluation.result') {
    const passed = (event.payload as { passed?: boolean }).passed === true;
    variant = passed ? 'status-complete' : 'status-failed';
  }
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <Pill variant={variant}>{event.type}</Pill>
        <span className="text-muted font-mono text-xs">
          #{event.sequenceNumber}
        </span>
      </div>
      <div className="text-foreground mt-1.5 text-sm">
        {summaryFor(event.type, event.payload)}
      </div>
      <ExpandablePayload json={JSON.stringify(event.payload, null, 2)} />
    </Card>
  );
}

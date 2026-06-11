import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TimelineEvent } from './timeline-event';

afterEach(() => cleanup());

describe('TimelineEvent', () => {
  it('renders pill + summary for an llm.request', () => {
    render(
      <TimelineEvent
        event={{
          id: 'e1',
          sequenceNumber: 0,
          type: 'llm.request',
          payload: { model: 'mock' },
        }}
      />,
    );
    expect(screen.getByText('llm.request')).toBeInTheDocument();
    expect(screen.getByText(/model=mock/)).toBeInTheDocument();
    expect(screen.getByText('#0')).toBeInTheDocument();
  });

  it('renders summary for a tool.call', () => {
    render(
      <TimelineEvent
        event={{
          id: 'e2',
          sequenceNumber: 2,
          type: 'tool.call',
          payload: { toolName: 'lookup_order', callId: 'c-1', input: {} },
        }}
      />,
    );
    expect(screen.getByText('lookup_order [c-1]')).toBeInTheDocument();
  });

  it('starts with payload collapsed and expands on click', () => {
    render(
      <TimelineEvent
        event={{
          id: 'e3',
          sequenceNumber: 1,
          type: 'tool.result',
          payload: { callId: 'c-1', output: { status: 'shipped' } },
        }}
      />,
    );
    expect(screen.queryByText(/shipped/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('▸ show payload'));
    expect(screen.getByText(/shipped/)).toBeInTheDocument();
  });
});

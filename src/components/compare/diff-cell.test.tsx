import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { DiffCell } from './diff-cell';

afterEach(() => cleanup());

const event = {
  id: 'e-1',
  sequenceNumber: 2,
  type: 'tool.call',
  payload: { toolName: 'lookup_order', callId: 'c-1', input: {} },
};

describe('DiffCell', () => {
  it('renders opacity-85 wrapper for match kind', () => {
    const { container } = render(
      <DiffCell event={event} kind="match" side="a" />,
    );
    expect(container.firstChild).toHaveAttribute('data-kind', 'match');
    expect((container.firstChild as HTMLElement).className).toContain(
      'opacity-85',
    );
  });

  it('renders changed background + ink border for diverge kind', () => {
    const { container } = render(
      <DiffCell event={event} kind="diverge" side="b" />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.getAttribute('data-kind')).toBe('diverge');
    expect(root.className).toContain('bg-divergence-changed');
  });

  it('renders only background for onlyA / onlyB kind', () => {
    const { container } = render(
      <DiffCell event={event} kind="onlyA" side="a" />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.getAttribute('data-kind')).toBe('onlyA');
    expect(root.className).toContain('bg-divergence-only');
  });

  it('exposes the side via data-side', () => {
    const { container } = render(
      <DiffCell event={event} kind="match" side="b" />,
    );
    expect(container.firstChild).toHaveAttribute('data-side', 'b');
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ComparableRunsShell } from './comparable-runs-shell';
import type { RunRow } from './runs-list';

afterEach(() => cleanup());

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

beforeEach(() => {
  pushMock.mockClear();
});

const r = (id: string, createdAt: Date): RunRow => ({
  id,
  status: 'COMPLETE',
  label: id,
  replayHash: null,
  totalTokensIn: 0,
  totalTokensOut: 0,
  durationMs: 100,
  createdAt,
});

describe('ComparableRunsShell', () => {
  it('does not show the compare button when zero runs selected', () => {
    render(<ComparableRunsShell runs={[r('a', new Date('2026-01-01'))]} />);
    expect(
      screen.queryByRole('button', { name: /compare/i }),
    ).not.toBeInTheDocument();
  });

  it('shows a disabled button when only one run is selected', () => {
    render(
      <ComparableRunsShell
        runs={[r('a', new Date('2026-01-01')), r('b', new Date('2026-01-02'))]}
      />,
    );
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    const button = screen.getByRole('button', { name: /select one more/i });
    expect(button).toBeDisabled();
  });

  it('enables the button when exactly two runs are selected', () => {
    render(
      <ComparableRunsShell
        runs={[r('a', new Date('2026-01-01')), r('b', new Date('2026-01-02'))]}
      />,
    );
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    const button = screen.getByRole('button', { name: /compare 2 runs/i });
    expect(button).not.toBeDisabled();
  });

  it('shows disabled "select exactly 2" when 3 runs selected', () => {
    render(
      <ComparableRunsShell
        runs={[
          r('a', new Date('2026-01-01')),
          r('b', new Date('2026-01-02')),
          r('c', new Date('2026-01-03')),
        ]}
      />,
    );
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    fireEvent.click(checkboxes[2]);
    const button = screen.getByRole('button', { name: /select exactly 2/i });
    expect(button).toBeDisabled();
  });

  it('pushes router with [older]/[newer] ids on click', () => {
    render(
      <ComparableRunsShell
        runs={[
          r('newer', new Date('2026-01-02')),
          r('older', new Date('2026-01-01')),
        ]}
      />,
    );
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]); // newer
    fireEvent.click(checkboxes[1]); // older
    fireEvent.click(screen.getByRole('button', { name: /compare 2 runs/i }));
    expect(pushMock).toHaveBeenCalledWith('/compare/older/newer');
  });
});

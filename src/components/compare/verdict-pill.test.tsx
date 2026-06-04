import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { VerdictPill } from './verdict-pill';

afterEach(() => cleanup());

describe('VerdictPill', () => {
  it('renders identical copy with pass-soft background', () => {
    render(
      <VerdictPill
        verdict="identical"
        firstDivergence={null}
        lenA={6}
        lenB={6}
      />,
    );
    expect(
      screen.getByText(/identical · ✓ byte-deterministic/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/identical · ✓ byte-deterministic/i).className,
    ).toContain('bg-pill-eval-pass-soft');
  });

  it('renders diverged copy at the first divergence index', () => {
    render(
      <VerdictPill verdict="diverged" firstDivergence={4} lenA={6} lenB={5} />,
    );
    expect(screen.getByText(/diverged @ #4/)).toBeInTheDocument();
    expect(screen.getByText(/diverged @ #4/).className).toContain(
      'bg-pill-eval-fail-soft',
    );
  });

  it('renders length-mismatch copy with both lengths', () => {
    render(
      <VerdictPill
        verdict="length-mismatch"
        firstDivergence={6}
        lenA={6}
        lenB={8}
      />,
    );
    expect(screen.getByText(/length mismatch · A=6 B=8/)).toBeInTheDocument();
    expect(screen.getByText(/length mismatch · A=6 B=8/).className).toContain(
      'bg-pill-tool-soft',
    );
  });
});

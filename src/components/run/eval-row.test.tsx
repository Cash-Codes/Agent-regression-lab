import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { EvalRow } from './eval-row';

afterEach(() => cleanup());

describe('EvalRow', () => {
  it('renders pass pill green for a passed assertion', () => {
    render(<EvalRow assertionId="a1" passed={true} description="confirms" />);
    expect(screen.getByText('a1')).toBeInTheDocument();
    const pill = screen.getByText('PASS');
    expect(pill.className).toContain('bg-pill-eval-pass-soft');
    expect(pill.className).toContain('text-pill-eval-pass');
  });

  it('renders fail pill red for a failed assertion and shows the message', () => {
    render(
      <EvalRow
        assertionId="a2"
        passed={false}
        message="expected response to contain 'confirm'"
      />,
    );
    const pill = screen.getByText('FAIL');
    expect(pill.className).toContain('bg-pill-eval-fail-soft');
    expect(pill.className).toContain('text-pill-eval-fail');
    expect(
      screen.getByText(/expected response to contain 'confirm'/i),
    ).toBeInTheDocument();
  });

  it('shows the description when provided', () => {
    render(
      <EvalRow assertionId="a1" passed={true} description="confirms intent" />,
    );
    expect(screen.getByText(/confirms intent/i)).toBeInTheDocument();
  });
});

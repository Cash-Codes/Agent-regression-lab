import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { DivergenceMarker } from './divergence-marker';

afterEach(() => cleanup());

describe('DivergenceMarker', () => {
  it('renders the sequence number and kind copy', () => {
    render(<DivergenceMarker seq={4} kind="diverge" />);
    expect(
      screen.getByText(/first divergence at #4 — diverge/i),
    ).toBeInTheDocument();
  });

  it('exposes id="first-divergence-marker" for the jump button to target', () => {
    const { container } = render(<DivergenceMarker seq={0} kind="onlyB" />);
    expect(container.querySelector('#first-divergence-marker')).not.toBeNull();
  });
});

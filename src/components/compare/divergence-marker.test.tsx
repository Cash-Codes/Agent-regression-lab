import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { DivergenceMarker } from './divergence-marker';

afterEach(() => cleanup());

describe('DivergenceMarker', () => {
  it('renders the sequence number and kind copy', () => {
    render(<DivergenceMarker seq={4} kind="diverge" side="a" />);
    expect(
      screen.getByText(/first divergence at #4 — diverge/i),
    ).toBeInTheDocument();
  });

  it('exposes id with the side suffix for the jump button to target', () => {
    const { container } = render(
      <DivergenceMarker seq={0} kind="onlyB" side="a" />,
    );
    expect(
      container.querySelector('#first-divergence-marker-a'),
    ).not.toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Pill } from './pill';

describe('Pill', () => {
  it('renders text content', () => {
    render(<Pill variant="llm.request">llm.request</Pill>);
    expect(screen.getByText('llm.request')).toBeInTheDocument();
  });

  it('applies the llm-soft background for an llm.request variant', () => {
    render(<Pill variant="llm.request">x</Pill>);
    const el = screen.getByText('x');
    expect(el.className).toContain('bg-pill-llm-soft');
    expect(el.className).toContain('text-pill-llm');
  });

  it('applies the failed status colors for status-failed', () => {
    render(<Pill variant="status-failed">FAILED</Pill>);
    const el = screen.getByText('FAILED');
    expect(el.className).toContain('bg-pill-eval-fail-soft');
    expect(el.className).toContain('text-pill-eval-fail');
  });

  it('exposes the variant via data-variant', () => {
    render(<Pill variant="tool.call">tool.call</Pill>);
    expect(screen.getByText('tool.call').getAttribute('data-variant')).toBe(
      'tool.call',
    );
  });
});
